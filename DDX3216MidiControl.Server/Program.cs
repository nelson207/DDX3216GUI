using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using MidiInterface.Controllers;
using MidiInterface.Data;
using MidiInterface.Services;
using System.Security.Claims;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ---------------- storage (everything lives in ./App_Data, keep it on a volume) ----------------
// (not "data": on Windows that is the same folder as the Data/ source folder)
var dataDir = builder.Configuration["DataDirectory"] is { Length: > 0 } d
    ? d
    : Path.Combine(builder.Environment.ContentRootPath, "App_Data");
Directory.CreateDirectory(dataDir);
var dbPath = builder.Configuration["Database:Path"] is { Length: > 0 } p ? p : Path.Combine(dataDir, "ddx3216.db");

builder.Services.AddDbContextFactory<AppDbContext>(o => o.UseSqlite($"Data Source={dbPath}"));

// login cookies stay valid across restarts
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(dataDir, "keys")))
    .SetApplicationName("DDX3216MidiControl");

// ---------------- auth ----------------
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.Name = "ddx3216.auth";
        o.Cookie.HttpOnly = true;
        o.Cookie.SameSite = SameSiteMode.Strict;
        o.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest; // the Pi serves plain HTTP on the LAN
        o.ExpireTimeSpan = TimeSpan.FromDays(30);
        o.SlidingExpiration = true;
        // API: answer 401/403 instead of redirecting to a login page
        o.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; };
        o.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = StatusCodes.Status403Forbidden; return Task.CompletedTask; };
        // reject cookies of deleted users or after a password/role change
        o.Events.OnValidatePrincipal = async ctx =>
        {
            var users = ctx.HttpContext.RequestServices.GetRequiredService<UserService>();
            var id = ctx.Principal?.GetUserId() ?? 0;
            var user = id == 0 ? null : await users.FindAsync(id);
            if (user == null || user.SecurityStamp != ctx.Principal!.FindFirstValue(AuthController.StampClaim))
            {
                ctx.RejectPrincipal();
                await ctx.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            }
        };
    });
builder.Services.AddAuthorization(o =>
    o.AddPolicy(Policies.CanOperate, p => p.RequireRole(Roles.Admin, Roles.Operator)));

builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy(RateLimits.Login, ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
});

// Behind nginx on the Pi: take the real client IP / scheme from X-Forwarded-* (trusted only from
// loopback proxies by default), so the login rate limit and logs see each device, not 127.0.0.1.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ---------------- app services ----------------
// Change pipeline: producers -> ChangeBus -> ChangeDispatcher -> state / MIDI OUT queue / clients
builder.Services.AddSingleton<BehringerStateStoreService>();
builder.Services.AddSingleton<MidiSettingsStore>();
builder.Services.AddSingleton<ChangeBus>();
builder.Services.AddSingleton<MidiRouterService>();
builder.Services.AddSingleton<MidiOutputQueue>();
builder.Services.AddSingleton<UserService>();
builder.Services.AddSingleton<SceneService>();
builder.Services.AddSingleton<ClientHub>();
builder.Services.AddSingleton<ChangeDispatcher>();
builder.Services.AddSingleton<MidiDeviceMonitor>();
builder.Services.AddSingleton<LiveStatePersistence>();

// Hosted services start in this order: saved values, ports, then the workers that use them
builder.Services.AddHostedService(sp => sp.GetRequiredService<LiveStatePersistence>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<MidiDeviceMonitor>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<MidiOutputQueue>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<ClientHub>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<ChangeDispatcher>());

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

// ---------------- database: create/upgrade schema, ensure an active scene ----------------
await using (var db = await app.Services.GetRequiredService<IDbContextFactory<AppDbContext>>().CreateDbContextAsync())
{
    await db.Database.MigrateAsync();
    await db.Database.ExecuteSqlRawAsync("PRAGMA journal_mode=WAL;"); // readers don't block the writer
}
await app.Services.GetRequiredService<SceneService>().InitializeAsync();
app.Logger.LogInformation("Database: {Path}", dbPath);

app.UseForwardedHeaders();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("AllowFrontend");

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// Protocol-level pings keep NAT/Wi-Fi mappings alive; app-level ping/pong (ClientHub) detects dead peers
app.UseWebSockets(new WebSocketOptions { KeepAliveInterval = TimeSpan.FromSeconds(15) });

app.MapGet("/_routes", (IEnumerable<EndpointDataSource> sources) =>
    sources.SelectMany(s => s.Endpoints).Select(e => e.DisplayName));
app.MapGet("/api/_debug", () => Results.Text("API OK FROM PI", "text/plain"));

app.MapGet("/health", (MidiRouterService router, ClientHub hub, MidiOutputQueue midiOut, SceneService scenes) =>
{
    var status = router.GetStatus();
    return Results.Ok(new
    {
        status = "ok",
        clients = hub.Count,
        midiOut = new { name = status.SelectedOutName, connected = status.OutConnected, queued = midiOut.Pending },
        midiIn = new { name = status.SelectedInName, connected = status.InConnected },
        channel = status.Channel,
        scene = scenes.Active.Name,
    });
});

app.MapControllers();

var allowedOrigins = app.Configuration.GetSection("WebSocket:AllowedOrigins").Get<string[]>() ?? [];
var checkOrigin = app.Configuration.GetValue("WebSocket:CheckOrigin", true);

app.Map("/ws/midi", async (HttpContext context, ClientHub hub) =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }

    // Browsers always send Origin: only accept pages served by this host (or configured origins),
    // so another web page open on the LAN can't drive the mixer.
    if (checkOrigin && !IsAllowedOrigin(context.Request, allowedOrigins))
    {
        app.Logger.LogWarning("Rejected WebSocket from origin {Origin}", context.Request.Headers.Origin.ToString());
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return;
    }

    if (context.User.Identity?.IsAuthenticated != true)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return;
    }

    using var ws = await context.WebSockets.AcceptWebSocketAsync();
    await hub.HandleAsync(ws, context.User, context.RequestAborted);
});

app.MapFallbackToFile("/index.html");

app.Run();

static bool IsAllowedOrigin(HttpRequest request, string[] allowed)
{
    var origin = request.Headers.Origin.ToString();
    if (string.IsNullOrEmpty(origin)) return true; // non-browser client
    if (allowed.Any(a => string.Equals(a.TrimEnd('/'), origin.TrimEnd('/'), StringComparison.OrdinalIgnoreCase))) return true;
    return Uri.TryCreate(origin, UriKind.Absolute, out var uri)
        && string.Equals(uri.Authority, request.Host.Value, StringComparison.OrdinalIgnoreCase);
}
