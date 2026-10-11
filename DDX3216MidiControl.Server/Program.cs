using MidiInterface.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Change pipeline: producers -> ChangeBus -> ChangeDispatcher -> state / MIDI OUT queue / clients
builder.Services.AddSingleton<BehringerStateStoreService>();
builder.Services.AddSingleton<MidiSettingsStore>();
builder.Services.AddSingleton<ChangeBus>();
builder.Services.AddSingleton<MidiRouterService>();
builder.Services.AddSingleton<MidiOutputQueue>();
builder.Services.AddSingleton<ClientHub>();
builder.Services.AddSingleton<ChangeDispatcher>();
builder.Services.AddSingleton<MidiDeviceMonitor>();

// Hosted services start in this order: ports first, then the workers that use them
builder.Services.AddHostedService(sp => sp.GetRequiredService<MidiDeviceMonitor>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<MidiOutputQueue>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<ClientHub>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<ChangeDispatcher>());

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("AllowFrontend");

app.UseSwagger();
app.UseSwaggerUI();

// Protocol-level pings keep NAT/Wi-Fi mappings alive; app-level ping/pong (ClientHub) detects dead peers
app.UseWebSockets(new WebSocketOptions { KeepAliveInterval = TimeSpan.FromSeconds(15) });

app.MapGet("/_routes", (IEnumerable<EndpointDataSource> sources) =>
    sources.SelectMany(s => s.Endpoints).Select(e => e.DisplayName));
app.MapGet("/api/_debug", () => Results.Text("API OK FROM PI", "text/plain"));

app.MapGet("/health", (MidiRouterService router, ClientHub hub, MidiOutputQueue midiOut) =>
{
    var status = router.GetStatus();
    return Results.Ok(new
    {
        status = "ok",
        clients = hub.Count,
        midiOut = new { name = status.SelectedOutName, connected = status.OutConnected, queued = midiOut.Pending },
        midiIn = new { name = status.SelectedInName, connected = status.InConnected },
        channel = status.Channel,
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

    using var ws = await context.WebSockets.AcceptWebSocketAsync();
    await hub.HandleAsync(ws, context.RequestAborted);
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
