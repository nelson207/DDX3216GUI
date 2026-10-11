namespace MidiInterface.Services
{
    /// <summary>
    /// Reopens the saved MIDI ports at startup and watches for USB unplug / re-plug,
    /// closing and reopening the selected ports as they disappear and come back.
    /// </summary>
    public sealed class MidiDeviceMonitor : BackgroundService
    {
        private readonly MidiRouterService _router;
        private readonly ILogger<MidiDeviceMonitor> _logger;
        private readonly TimeSpan _interval;

        public MidiDeviceMonitor(MidiRouterService router, IConfiguration config, ILogger<MidiDeviceMonitor> logger)
        {
            _router = router;
            _logger = logger;
            _interval = TimeSpan.FromSeconds(Math.Max(1, config.GetValue("Midi:PollSeconds", 3)));
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using var timer = new PeriodicTimer(_interval);
            do
            {
                try
                {
                    _router.PollDevices();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "MIDI device poll failed");
                }
            }
            while (await WaitAsync(timer, stoppingToken));
        }

        private static async Task<bool> WaitAsync(PeriodicTimer timer, CancellationToken ct)
        {
            try { return await timer.WaitForNextTickAsync(ct); }
            catch (OperationCanceledException) { return false; }
        }
    }
}
