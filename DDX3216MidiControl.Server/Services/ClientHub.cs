using MidiInterface.Models;
using System.Buffers;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Security.Claims;
using MidiInterface.Data;
using System.Text.Json;
using System.Threading.Channels;

namespace MidiInterface.Services
{
    /// <summary>
    /// WebSocket clients. Each client has a bounded outbound queue drained by its own writer task,
    /// so a slow or half-open client (phone asleep, Wi-Fi gone) only ever delays itself: when its
    /// queue overflows or a send times out it is disconnected, and on reconnect it gets a fresh snapshot.
    /// </summary>
    public sealed class ClientHub : BackgroundService
    {
        public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

        private readonly ConcurrentDictionary<Guid, WsClient> _clients = new();
        private readonly ChangeBus _bus;
        private readonly MidiRouterService _router;
        private readonly BehringerStateStoreService _state;
        private readonly SceneService _scenes;
        private readonly ILogger<ClientHub> _logger;

        private readonly int _maxMessageBytes;
        private readonly int _queueCapacity;
        private readonly TimeSpan _sendTimeout;
        private readonly TimeSpan _idleTimeout;

        public ClientHub(ChangeBus bus, MidiRouterService router, BehringerStateStoreService state, SceneService scenes,
            UserService users, IConfiguration config, ILogger<ClientHub> logger)
        {
            _bus = bus;
            _router = router;
            _state = state;
            _scenes = scenes;
            _logger = logger;
            _maxMessageBytes = config.GetValue("WebSocket:MaxMessageBytes", 64 * 1024);
            _queueCapacity = config.GetValue("WebSocket:QueueCapacity", 512);
            _sendTimeout = TimeSpan.FromSeconds(config.GetValue("WebSocket:SendTimeoutSeconds", 5));
            _idleTimeout = TimeSpan.FromSeconds(config.GetValue("WebSocket:IdleTimeoutSeconds", 30));

            _router.StatusChanged += () => Broadcast(new WsStatusMessage(_router.GetStatus()));
            _scenes.ActiveSceneChanged += scene => Broadcast(new WsSceneMessage(scene));
            users.SessionsInvalidated += DisconnectUser;
        }

        public int Count => _clients.Count;

        // ---------------- outbound ----------------

        public void Broadcast(object message, Guid? exclude = null)
        {
            if (_clients.IsEmpty) return;
            var bytes = JsonSerializer.SerializeToUtf8Bytes(message, message.GetType(), Json);
            foreach (var client in _clients.Values)
            {
                if (client.Id != exclude) Enqueue(client, bytes);
            }
        }

        public void Send(Guid clientId, object message)
        {
            if (_clients.TryGetValue(clientId, out var client))
                Enqueue(client, JsonSerializer.SerializeToUtf8Bytes(message, message.GetType(), Json));
        }

        private void Enqueue(WsClient client, byte[] bytes)
        {
            if (client.Outbound.Writer.TryWrite(bytes)) return;

            // Queue full (burst, or a slow link): the queued changes are already superseded by the
            // state store, so drop them and send one fresh snapshot instead. A peer that can't send
            // at all is caught by the send timeout in WriterLoop.
            while (client.Outbound.Reader.TryRead(out _)) { }
            if (client.Outbound.Writer.TryWrite(SnapshotBytes()))
            {
                _logger.LogInformation("Client {Client} fell behind ({Capacity} queued); resynced with a snapshot", client.Id, _queueCapacity);
            }
            else
            {
                Kick(client);
            }
        }

        private byte[] SnapshotBytes()
        {
            var snapshot = _state.Snapshot().Select(kv => new BehringerChange(kv.Key.Module, kv.Key.Param, kv.Value)).ToArray();
            return JsonSerializer.SerializeToUtf8Bytes(new WsChangesMessage(WsMessageTypes.Snapshot, snapshot), Json);
        }

        private async Task WriterLoop(WsClient client)
        {
            try
            {
                await foreach (var bytes in client.Outbound.Reader.ReadAllAsync(client.Cts.Token))
                {
                    using var timeout = CancellationTokenSource.CreateLinkedTokenSource(client.Cts.Token);
                    timeout.CancelAfter(_sendTimeout);
                    await client.Socket.SendAsync(bytes, WebSocketMessageType.Text, true, timeout.Token);
                }
            }
            catch (OperationCanceledException) when (!client.Cts.IsCancellationRequested)
            {
                _logger.LogWarning("Send to client {Client} timed out; disconnecting", client.Id);
                Kick(client);
            }
            catch (OperationCanceledException) { }
            catch (Exception ex) when (ex is WebSocketException or ObjectDisposedException)
            {
                Kick(client);
            }
        }

        // ---------------- connection ----------------

        public async Task HandleAsync(WebSocket socket, ClaimsPrincipal user, CancellationToken requestAborted)
        {
            var client = new WsClient(socket, Channel.CreateBounded<byte[]>(new BoundedChannelOptions(_queueCapacity)
            {
                SingleReader = false, // the writer loop reads; Enqueue drains it on overflow
                FullMode = BoundedChannelFullMode.Wait, // TryWrite fails when full -> resync
            }), CancellationTokenSource.CreateLinkedTokenSource(requestAborted))
            {
                UserId = int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : 0,
                CanWrite = Roles.CanOperate(user.FindFirstValue(ClaimTypes.Role)),
            };

            _clients[client.Id] = client;
            _logger.LogInformation("Client {Client} connected ({Count} total)", client.Id, _clients.Count);

            // initial state: everything the server knows + MIDI status
            Enqueue(client, SnapshotBytes());
            Send(client.Id, new WsStatusMessage(_router.GetStatus()));
            Send(client.Id, new WsSceneMessage(_scenes.Active));

            var writer = Task.Run(() => WriterLoop(client));
            try
            {
                await ReceiveLoop(client);
            }
            catch (Exception ex) when (ex is OperationCanceledException or WebSocketException)
            {
                // client went away
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Client {Client} receive loop failed", client.Id);
            }
            finally
            {
                _clients.TryRemove(client.Id, out _);
                client.Outbound.Writer.TryComplete();
                client.Cts.Cancel();
                try { await writer.WaitAsync(TimeSpan.FromSeconds(2)); } catch { }
                try
                {
                    if (socket.State is WebSocketState.Open or WebSocketState.CloseReceived)
                    {
                        using var closeTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Bye", closeTimeout.Token);
                    }
                }
                catch { }
                client.Cts.Dispose();
                _logger.LogInformation("Client {Client} disconnected ({Count} left)", client.Id, _clients.Count);
            }
        }

        private async Task ReceiveLoop(WsClient client)
        {
            var socket = client.Socket;
            var buffer = ArrayPool<byte>.Shared.Rent(8192);
            try
            {
                using var message = new MemoryStream();
                while (socket.State == WebSocketState.Open && !client.Cts.IsCancellationRequested)
                {
                    message.SetLength(0);
                    ValueWebSocketReceiveResult result;
                    do
                    {
                        result = await socket.ReceiveAsync(buffer.AsMemory(), client.Cts.Token);
                        if (result.MessageType == WebSocketMessageType.Close) return;
                        message.Write(buffer, 0, result.Count);
                        if (message.Length > _maxMessageBytes)
                        {
                            _logger.LogWarning("Client {Client} sent a message over {Max} bytes; closing", client.Id, _maxMessageBytes);
                            await socket.CloseAsync(WebSocketCloseStatus.MessageTooBig, "Message too big", CancellationToken.None);
                            return;
                        }
                    } while (!result.EndOfMessage);

                    client.LastSeen = DateTime.UtcNow;
                    if (result.MessageType == WebSocketMessageType.Text)
                        HandleMessage(client, message.GetBuffer().AsSpan(0, (int)message.Length));
                }
            }
            finally
            {
                ArrayPool<byte>.Shared.Return(buffer);
            }
        }

        private void HandleMessage(WsClient client, ReadOnlySpan<byte> utf8)
        {
            BehringerChange[]? changes;
            try
            {
                var reader = new Utf8JsonReader(utf8);
                using var doc = JsonDocument.ParseValue(ref reader);
                var root = doc.RootElement;

                if (root.ValueKind == JsonValueKind.Array)
                {
                    changes = root.Deserialize<BehringerChange[]>(Json); // legacy bare array
                }
                else if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("type", out var type))
                {
                    switch (type.GetString())
                    {
                        case WsMessageTypes.Ping:
                            client.UsesPing = true;
                            Send(client.Id, new WsPongMessage());
                            return;
                        case WsMessageTypes.Changes:
                            changes = root.TryGetProperty("changes", out var c) ? c.Deserialize<BehringerChange[]>(Json) : null;
                            break;
                        default:
                            return; // unknown types are ignored for forward compatibility
                    }
                }
                else
                {
                    return;
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning("Ignoring invalid message from {Client}: {Error}", client.Id, ex.Message);
                Send(client.Id, new WsErrorMessage("Invalid message"));
                return;
            }

            if (changes == null || changes.Length == 0) return;

            if (!client.CanWrite)
            {
                Send(client.Id, new WsErrorMessage("Read-only account: changes are not allowed."));
                return;
            }

            if (changes.Any(c => c == null || !c.IsValid()))
            {
                Send(client.Id, new WsErrorMessage("Rejected changes: module/param must be 0..127 and value 0..16383"));
                return;
            }

            _bus.Publish(changes, ChangeSource.Client, client.Id);
        }

        /// <summary>Closes every connection of a user (deleted, role or password changed).</summary>
        public void DisconnectUser(int userId)
        {
            foreach (var client in _clients.Values)
            {
                if (client.UserId == userId)
                {
                    _logger.LogInformation("Closing connection {Client} of user {User}", client.Id, userId);
                    Kick(client);
                }
            }
        }

        // ---------------- liveness ----------------

        private void Kick(WsClient client)
        {
            try { client.Cts.Cancel(); } catch (ObjectDisposedException) { }
            try { client.Socket.Abort(); } catch { }
        }

        /// <summary>Disconnects clients that use the ping protocol but went silent (half-open sockets).</summary>
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using var timer = new PeriodicTimer(TimeSpan.FromSeconds(5));
            try
            {
                while (await timer.WaitForNextTickAsync(stoppingToken))
                {
                    var now = DateTime.UtcNow;
                    foreach (var client in _clients.Values)
                    {
                        if (client.UsesPing && now - client.LastSeen > _idleTimeout)
                        {
                            _logger.LogInformation("Client {Client} silent for {Seconds:0}s; disconnecting", client.Id, (now - client.LastSeen).TotalSeconds);
                            Kick(client);
                        }
                    }
                }
            }
            catch (OperationCanceledException) { }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            foreach (var client in _clients.Values) Kick(client);
            await base.StopAsync(cancellationToken);
        }

        private sealed class WsClient
        {
            public WsClient(WebSocket socket, Channel<byte[]> outbound, CancellationTokenSource cts)
            {
                Socket = socket;
                Outbound = outbound;
                Cts = cts;
            }

            public Guid Id { get; } = Guid.NewGuid();
            public int UserId { get; init; }
            public bool CanWrite { get; init; }
            public WebSocket Socket { get; }
            public Channel<byte[]> Outbound { get; }
            public CancellationTokenSource Cts { get; }
            // ticks + Interlocked: written by the receive loop, read by the reaper (safe on 32-bit ARM too)
            private long _lastSeenTicks = DateTime.UtcNow.Ticks;
            public DateTime LastSeen
            {
                get => new(Interlocked.Read(ref _lastSeenTicks), DateTimeKind.Utc);
                set => Interlocked.Exchange(ref _lastSeenTicks, value.Ticks);
            }

            private volatile bool _usesPing;
            public bool UsesPing { get => _usesPing; set => _usesPing = value; }
        }
    }
}
