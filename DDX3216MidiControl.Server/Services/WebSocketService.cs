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
        // WebSocket.SendAsync does not allow concurrent calls on the same socket:
        // broadcasts from MIDI IN and from other clients must be serialized per client.
        private readonly ConcurrentDictionary<Guid, SemaphoreSlim> _sendLocks = new();
        private int _bufferSize = 8192;
        private MidiRouterService _router;
        private BehringerStateStoreService _behringerStateStoreService;
        private readonly ILogger<WebSocketService> _logger;

        public WebSocketService(MidiRouterService router, ConcurrentDictionary<Guid, WebSocket> clients, BehringerStateStoreService behringerStateStoreService, ILogger<WebSocketService> logger)
        {
            _router = router;
            _clients = clients;
            _behringerStateStoreService = behringerStateStoreService;
            _logger = logger;

            _router.WebSocketHandler = this;
        }

        public async Task BroadcastToClientsAsync(string changes, Guid? originId, CancellationToken ct)
        {
            var bytes = Encoding.UTF8.GetBytes(changes);
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

                var sendLock = _sendLocks.GetOrAdd(kv.Key, _ => new SemaphoreSlim(1, 1));
                await sendLock.WaitAsync(ct);
                try
                {
                    await ws.SendAsync(bytes, WebSocketMessageType.Text, true, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "WebSocket send failed for client {Client}", kv.Key);
                    dead.Add(kv.Key);
                }
                finally
                {
                    sendLock.Release();
                }
            }

            foreach (var id in dead)
            {
                if (_clients.TryRemove(id, out var ws))
                    ws.Abort(); // make the receive loop end so the client reconnects
                _sendLocks.TryRemove(id, out _);
            }
        }

        public async Task HandleClientWebSocketAsync(WebSocket ws, CancellationToken ct)
        {
            var id = Guid.NewGuid();
            _clients[id] = ws;
            _sendLocks[id] = new SemaphoreSlim(1, 1);

            var buffer = new byte[_bufferSize];

            try
            {
                while (!ct.IsCancellationRequested && ws.State == WebSocketState.Open)
                {
                    var result = await ws.ReceiveAsync(buffer, ct);
                    if (result.MessageType == WebSocketMessageType.Close)
                        break;

                    if (result.MessageType != WebSocketMessageType.Text)
                        continue;

                    using var ms = new MemoryStream();

                    ms.Write(buffer, 0, result.Count);

                    while (!result.EndOfMessage)
                    {
                        result = await ws.ReceiveAsync(buffer, ct);
                        ms.Write(buffer, 0, result.Count);
                    }

                    // UTF-8 decode
                    string text = Encoding.UTF8.GetString(ms.ToArray());

                    // A bad message must not kill the connection
                    BehringerChange[]? changes;
                    try
                    {
                        changes = JsonSerializer.Deserialize<BehringerChange[]>(text);
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogWarning("Ignoring invalid WebSocket message: {Error}", ex.Message);
                        continue;
                    }

                    if (changes == null || changes.Length == 0 || _router.SelectedOutDevice == null)
                        continue;

                    try
                    {
                        foreach (var sysex in BehringerUtilities.SysExEncodeAll(changes, _router))
                            await _router.SendBytesAsync(sysex, ct);

                        _behringerStateStoreService.SetMany(changes);
                        await BroadcastToClientsAsync(text, id, ct);
                    }
                    catch (OperationCanceledException)
                    {
                        throw;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to forward WebSocket changes to MIDI");
                    }
                }
            }
            catch (OperationCanceledException) { }
            catch (WebSocketException) { }
            finally
            {
                _clients.TryRemove(id, out _);
                _sendLocks.TryRemove(id, out _);
                try
                {
                    if (ws.State == WebSocketState.Open || ws.State == WebSocketState.CloseReceived)
                        await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Connection Closed", CancellationToken.None);
                }
                catch {}
            }
        }

        public void Dispose()
        {
            foreach (var ws in _clients.Values)
            {
                try { ws.Abort(); } catch { }
            }
            _clients.Clear();
        }
    }
}
