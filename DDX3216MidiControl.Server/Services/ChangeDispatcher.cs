using MidiInterface.Models;

namespace MidiInterface.Services
{
    /// <summary>
    /// The only consumer of <see cref="ChangeBus"/>: applies every change in arrival order.
    ///   client change -> state store, MIDI OUT queue, other clients
    ///   MIDI IN change -> state store, all clients (echoes of our own sends are dropped)
    /// </summary>
    public sealed class ChangeDispatcher : BackgroundService
    {
        private readonly ChangeBus _bus;
        private readonly BehringerStateStoreService _state;
        private readonly MidiOutputQueue _midiOut;
        private readonly MidiRouterService _router;
        private readonly ClientHub _hub;
        private readonly ILogger<ChangeDispatcher> _logger;
        private readonly EchoFilter _echo = new(TimeSpan.FromSeconds(2));
        private DateTime _lastNoOutputWarning = DateTime.MinValue;

        public ChangeDispatcher(ChangeBus bus, BehringerStateStoreService state, MidiOutputQueue midiOut,
            MidiRouterService router, ClientHub hub, ILogger<ChangeDispatcher> logger)
        {
            _bus = bus;
            _state = state;
            _midiOut = midiOut;
            _router = router;
            _hub = hub;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                await foreach (var batch in _bus.Reader.ReadAllAsync(stoppingToken))
                {
                    try
                    {
                        if (batch.Source == ChangeSource.Client) FromClient(batch);
                        else FromMidi(batch);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to dispatch {Count} change(s) from {Source}", batch.Changes.Length, batch.Source);
                    }
                }
            }
            catch (OperationCanceledException) { }
        }

        private void FromClient(ChangeBatch batch)
        {
            if (!_router.HasOutput)
            {
                // nothing would reach the console: tell the sender instead of failing silently
                var now = DateTime.UtcNow;
                if (batch.OriginClient is Guid origin && now - _lastNoOutputWarning > TimeSpan.FromSeconds(3))
                {
                    _lastNoOutputWarning = now;
                    _hub.Send(origin, new WsErrorMessage("No MIDI output is open: changes are not reaching the console."));
                }
                return;
            }

            _state.SetMany(batch.Changes);
            foreach (var c in batch.Changes) _echo.Remember(c);
            _midiOut.Enqueue(batch.Changes);
            _hub.Broadcast(new WsChangesMessage(WsMessageTypes.Changes, batch.Changes), exclude: batch.OriginClient);
        }

        private void FromMidi(ChangeBatch batch)
        {
            // MIDI loopbacks (e.g. "Midi Through" as IN and OUT) return what we just sent
            var fresh = batch.Changes.Where(c => !_echo.Consume(c)).ToArray();
            if (fresh.Length == 0) return;

            _state.SetMany(fresh);
            _hub.Broadcast(new WsChangesMessage(WsMessageTypes.Changes, fresh));
        }

        /// <summary>Remembers values sent to MIDI OUT for a short time so their echo can be recognised.</summary>
        private sealed class EchoFilter
        {
            private const int HardCap = 50_000; // best effort: beyond this just start over
            private readonly TimeSpan _ttl;
            private readonly Dictionary<(ModuleParamKey Key, int Value), DateTime> _sent = new();
            private DateTime _lastPrune = DateTime.MinValue;

            public EchoFilter(TimeSpan ttl) => _ttl = ttl;

            public void Remember(BehringerChange c)
            {
                var now = DateTime.UtcNow;
                // prune at most twice a second (pruning on every call is O(n) per change)
                if (_sent.Count > 4096 && now - _lastPrune > TimeSpan.FromMilliseconds(500))
                {
                    _lastPrune = now;
                    Prune();
                }
                if (_sent.Count > HardCap) _sent.Clear();
                _sent[(c.Key, (int)Math.Round(c.Value))] = now + _ttl;
            }

            public bool Consume(BehringerChange c)
            {
                var k = (c.Key, (int)Math.Round(c.Value));
                if (_sent.TryGetValue(k, out var expires) && expires > DateTime.UtcNow)
                {
                    _sent.Remove(k);
                    return true;
                }
                return false;
            }

            private void Prune()
            {
                var now = DateTime.UtcNow;
                foreach (var k in _sent.Where(kv => kv.Value <= now).Select(kv => kv.Key).ToList())
                    _sent.Remove(k);
            }
        }
    }
}
