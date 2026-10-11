using Microsoft.EntityFrameworkCore;
using MidiInterface.Data;
using MidiInterface.Models;

namespace MidiInterface.Services
{
    /// <summary>
    /// Loads the last known mixer values from the database at startup and writes changed values
    /// back every couple of seconds (write-behind, so fader drags never wait on the disk).
    /// </summary>
    public sealed class LiveStatePersistence : BackgroundService
    {
        private static readonly TimeSpan FlushInterval = TimeSpan.FromSeconds(2);
        private readonly IDbContextFactory<AppDbContext> _db;
        private readonly BehringerStateStoreService _state;
        private readonly ILogger<LiveStatePersistence> _logger;

        public LiveStatePersistence(IDbContextFactory<AppDbContext> db, BehringerStateStoreService state, ILogger<LiveStatePersistence> logger)
        {
            _db = db;
            _state = state;
            _logger = logger;
        }

        public override async Task StartAsync(CancellationToken cancellationToken)
        {
            // runs before the hosted services registered after this one start
            await using var db = await _db.CreateDbContextAsync(cancellationToken);
            var values = await db.LiveParameters.AsNoTracking()
                .Select(p => new KeyValuePair<ModuleParamKey, double>(new ModuleParamKey(p.Module, p.Param), p.Value))
                .ToListAsync(cancellationToken);
            _state.Load(values);
            _logger.LogInformation("Loaded {Count} saved parameter values", values.Count);
            await base.StartAsync(cancellationToken);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using var timer = new PeriodicTimer(FlushInterval);
            try
            {
                while (await timer.WaitForNextTickAsync(stoppingToken))
                    await FlushAsync(stoppingToken);
            }
            catch (OperationCanceledException) { }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            await base.StopAsync(cancellationToken);
            await FlushAsync(CancellationToken.None); // last changes before shutdown
        }

        private async Task FlushAsync(CancellationToken ct)
        {
            var dirty = _state.TakeDirty();
            if (dirty.Count == 0) return;
            try
            {
                await using var db = await _db.CreateDbContextAsync(ct);
                await using var tx = await db.Database.BeginTransactionAsync(ct);
                foreach (var (key, value) in dirty)
                {
                    await db.Database.ExecuteSqlInterpolatedAsync(
                        $"INSERT INTO LiveParameters (Module, Param, Value) VALUES ({key.Module}, {key.Param}, {value}) ON CONFLICT(Module, Param) DO UPDATE SET Value = excluded.Value", ct);
                }
                await tx.CommitAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not save {Count} parameter values", dirty.Count);
                _state.MarkDirty(dirty.Select(d => d.Key)); // retry next time, keeping any newer values
            }
        }
    }
}
