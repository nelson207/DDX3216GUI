using MidiInterface.Helpers;
using MidiInterface.Models;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace MidiInterface.Services
{
    public class WebSocketService : IDisposable
    {
        private ConcurrentDictionary<Guid, WebSocket> _clients;
        private int _bufferSize = 8192;
        private MidiRouterService _router;
        private BehringerStateStoreService _behringerStateStoreService;

        public WebSocketService(MidiRouterService router, ConcurrentDictionary<Guid, WebSocket> clients, BehringerStateStoreService behringerStateStoreService)
        {
            _router = router;
            _clients = clients;
            _behringerStateStoreService = behringerStateStoreService;

            _router.WebSocketHandler = this;
        }

        public async Task BroadcastToClientsAsync(string changes, Guid? originId, CancellationToken ct)
        {
            var dead = new List<Guid>();

            foreach (var kv in _clients)
            {
                if (originId != null && kv.Key == originId)
                    continue;

                var ws = kv.Value;
                if (ws.State != WebSocketState.Open)
                {
                    dead.Add(kv.Key);
                    continue;
                }

                try
                {                 
                    await ws.SendAsync
                        (Encoding.UTF8.GetBytes(changes), WebSocketMessageType.Text, true, ct);
                }
                catch
                {
                    dead.Add(kv.Key);
                }
            }

            foreach (var id in dead)
                _clients.TryRemove(id, out _);
        }

        public async Task HandleClientWebSocketAsync(WebSocket ws, CancellationToken ct)
        {
            var id = Guid.NewGuid();
            _clients[id] = ws;

            var buffer = new byte[_bufferSize];

            try
            {
                while (!ct.IsCancellationRequested && ws.State == WebSocketState.Open)
                {
                    var result = await ws.ReceiveAsync(buffer, ct);
                    if (result.MessageType == WebSocketMessageType.Close)
                        break;

                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        using var ms = new MemoryStream();

                        ms.Write(buffer, 0, result.Count);

                        while (!result.EndOfMessage)
                        {
                            result = await ws.ReceiveAsync(buffer, ct);
                            ms.Write(buffer, 0, result.Count);
                        }

                        // UTF-8 decode
                        string text = Encoding.UTF8.GetString(ms.ToArray());
#pragma warning disable CS8600 // Converting null literal or possible null value to non-nullable type.
                        BehringerChange[] changes = JsonSerializer.Deserialize<BehringerChange[]>(text);
#pragma warning restore CS8600 // Converting null literal or possible null value to non-nullable type.

                        if (changes != null)
                        {
                            var sysex = BehringerUtilities.SysExEncode(changes, _router);

                            await _router.SendBytesAsync(sysex, ct);
                            await BroadcastToClientsAsync(text, id, ct);
                            _behringerStateStoreService.SetMany(changes);
                        }
                    }
                }
            }
            finally
            {
                _clients.TryRemove(id, out _);
                try
                {
                    await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Connection Closed", CancellationToken.None);
                }
                catch { }
            }
        }

        public void Dispose()
        {
            _router.Dispose();
        }
    }
}
