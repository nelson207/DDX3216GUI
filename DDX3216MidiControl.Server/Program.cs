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
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

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


app.MapFallbackToFile("/index.html");

app.Run();
