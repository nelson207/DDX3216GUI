using MidiInterface.Helpers;
using MidiInterface.Models;

namespace MidiInterface.Services
{
    /// <summary>
    /// Coalescing, paced MIDI OUT writer.
    /// - keeps only the latest value per (module, param) while waiting to send (fader drags
    ///   from several clients collapse instead of piling up)
    /// - packs up to 23 changes into one SysEx
    /// - paces output to the MIDI DIN bandwidth (~3125 bytes/s) so USB-MIDI interfaces don't overflow
    /// </summary>
    public sealed class MidiOutputQueue : BackgroundService
    {
        private readonly MidiRouterService _router;
        private readonly ILogger<MidiOutputQueue> _logger;
        private readonly double _bytesPerSecond;

        private readonly object _gate = new();
        private readonly Dictionary<ModuleParamKey, double> _pending = new();
        private readonly List<ModuleParamKey> _order = new();
        private readonly SemaphoreSlim _signal = new(0, 1);

        public MidiOutputQueue(MidiRouterService router, IConfiguration config, ILogger<MidiOutputQueue> logger)
        {
            _router = router;
            _logger = logger;
            _bytesPerSecond = Math.Max(500, config.GetValue("Midi:MaxBytesPerSecond", 3000.0));
        }

        public int Pending { get { lock (_gate) return _order.Count; } }

        public void Enqueue(IEnumerable<BehringerChange> changes)
        {
            lock (_gate)
            {
                foreach (var c in changes)
                {
                    if (!_pending.ContainsKey(c.Key)) _order.Add(c.Key);
                    _pending[c.Key] = c.Value;
                }
                if (_signal.CurrentCount == 0) _signal.Release();
            }
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await _signal.WaitAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }

                while (TakeBatch() is { Length: > 0 } batch)
                {
                    try
                    {
                        var sysex = BehringerUtilities.SysExEncode(batch, _router.Channel);
                        if (!_router.Send(sysex))
                        {
                            // no open port (closed or unplugged): nothing can be delivered, drop the queue
                            lock (_gate) { _pending.Clear(); _order.Clear(); }
                            break;
                        }

                        var pause = TimeSpan.FromSeconds(sysex.Length / _bytesPerSecond);
                        if (pause > TimeSpan.FromMilliseconds(1))
                            await Task.Delay(pause, stoppingToken); // newer values coalesce meanwhile
                    }
                    catch (OperationCanceledException)
                    {
                        return;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send MIDI batch");
                    }
                }
            }
        }

        private BehringerChange[] TakeBatch()
        {
            lock (_gate)
            {
                int n = Math.Min(_order.Count, BehringerUtilities.MaxChangesPerSysEx);
                var batch = new BehringerChange[n];
                for (int i = 0; i < n; i++)
                {
                    var key = _order[i];
                    batch[i] = new BehringerChange(key.Module, key.Param, _pending[key]);
                    _pending.Remove(key);
                }
                _order.RemoveRange(0, n);
                return batch;
            }
        }
    }
}
