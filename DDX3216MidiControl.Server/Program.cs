using MidiInterface.Services;
using System.Collections.Concurrent;
using System.Net.WebSockets;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddSingleton<MidiRouterService>();
builder.Services.AddSingleton<ConcurrentDictionary<Guid, WebSocket>>();
builder.Services.AddSingleton<WebSocketService>();
builder.Services.AddSingleton<BehringerStateStoreService>();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .AllowAnyOrigin()   // ou especifique http://localhost:5173
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("AllowFrontend");

// Configure the HTTP request pipeline.
<<<<<<< HEAD

app.UseSwagger();
app.UseSwaggerUI();


app.MapGet("/_routes", (IEnumerable<EndpointDataSource> sources) =>
    sources.SelectMany(s => s.Endpoints).Select(e => e.DisplayName));
app.MapGet("/api/_debug", () => Results.Text("API OK FROM PI", "text/plain"));
=======
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

>>>>>>> 4cc5cafa7afe3325d95da46839077f2761b768a9
app.MapControllers();

app.UseWebSockets();

app.Map("/ws/midi", async context =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = 400;
        return;
    }

    var webSocket = context.RequestServices.GetRequiredService<WebSocketService>();

    using var ws = await context.WebSockets.AcceptWebSocketAsync();
    await webSocket.HandleClientWebSocketAsync(ws, context.RequestAborted);
});

<<<<<<< HEAD
=======

>>>>>>> 4cc5cafa7afe3325d95da46839077f2761b768a9
app.MapFallbackToFile("/index.html");

app.Run();
