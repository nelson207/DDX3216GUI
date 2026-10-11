using Microsoft.EntityFrameworkCore;
using MidiInterface.Data;
using MidiInterface.Helpers;
using MidiInterface.Models;

namespace MidiInterface.Services
{
    /// <summary>
    /// App-side scenes (the DDX3216 doesn't report its scene over SysEx). One scene is active for
    /// everyone; it provides the fader names. A scene can also hold a full parameter snapshot,
    /// which is sent to the console when the scene is activated with mode "all".
    /// </summary>
    public sealed class SceneService
    {
        public const int MaxSceneName = 64;
        public const int MaxLabelName = 32;
        private const string DefaultSceneName = "Default";

        private readonly IDbContextFactory<AppDbContext> _db;
        private readonly BehringerStateStoreService _state;
        private readonly ChangeBus _bus;
        private readonly MidiRouterService _router;
        private readonly IConfiguration _config;
        private readonly ILogger<SceneService> _logger;
        private readonly SemaphoreSlim _gate = new(1, 1); // serialises writes that affect the active scene

        private volatile ActiveSceneDto _active = new(0, DefaultSceneName, []);

        /// <summary>Raised after the active scene or its labels change.</summary>
        public event Action<ActiveSceneDto>? ActiveSceneChanged;

        public SceneService(IDbContextFactory<AppDbContext> db, BehringerStateStoreService state, ChangeBus bus,
            MidiRouterService router, IConfiguration config, ILogger<SceneService> logger)
        {
            _db = db;
            _state = state;
            _bus = bus;
            _router = router;
            _config = config;
            _logger = logger;
        }

        public ActiveSceneDto Active => _active;

        /// <summary>Makes sure a scene exists and is active, then caches it.</summary>
        public async Task InitializeAsync(CancellationToken ct = default)
        {
            await using var db = await _db.CreateDbContextAsync(ct);
            var state = await db.AppState.FindAsync([1], ct);
            if (state == null)
            {
                state = new AppState();
                db.AppState.Add(state);
            }
            if (state.ActiveSceneId == null || !await db.Scenes.AnyAsync(s => s.Id == state.ActiveSceneId, ct))
            {
                var scene = await db.Scenes.OrderBy(s => s.Id).FirstOrDefaultAsync(ct);
                if (scene == null)
                {
                    scene = new Scene { Name = DefaultSceneName };
                    db.Scenes.Add(scene);
                    await db.SaveChangesAsync(ct);
                }
                state.ActiveSceneId = scene.Id;
            }
            await db.SaveChangesAsync(ct);
            _active = await LoadActiveAsync(db, state.ActiveSceneId!.Value, ct);
        }

        public async Task<List<SceneSummaryDto>> ListAsync(CancellationToken ct = default)
        {
            await using var db = await _db.CreateDbContextAsync(ct);
            var activeId = _active.Id;
            return await db.Scenes.AsNoTracking()
                .OrderBy(s => s.Name)
                .Select(s => new SceneSummaryDto(
                    s.Id, s.Name, s.UpdatedAt, s.ParametersCapturedAt,
                    s.Parameters.Count, s.Labels.Count, s.Id == activeId))
                .ToListAsync(ct);
        }

        public async Task<SceneSummaryDto> CreateAsync(CreateSceneRequest request, int? userId, CancellationToken ct = default)
        {
            var name = CleanName(request.Name, MaxSceneName, "Scene name");
            await using var db = await _db.CreateDbContextAsync(ct);
            if (await db.Scenes.AnyAsync(s => s.Name == name, ct))
                throw new ArgumentException($"A scene called \"{name}\" already exists.");

            var scene = new Scene { Name = name, UpdatedByUserId = userId };
            if (request.CopyLabelsFromSceneId is int from)
            {
                scene.Labels = await db.SceneLabels.AsNoTracking().Where(l => l.SceneId == from)
                    .Select(l => new SceneLabel { Module = l.Module, Name = l.Name, Color = l.Color })
                    .ToListAsync(ct);
            }
            if (request.CaptureParameters)
            {
                scene.Parameters = SnapshotParameters();
                scene.ParametersCapturedAt = DateTime.UtcNow;
            }
            db.Scenes.Add(scene);
            await db.SaveChangesAsync(ct);
            _logger.LogInformation("Scene {Name} created ({Labels} labels, {Params} parameters)", name, scene.Labels.Count, scene.Parameters.Count);
            return new SceneSummaryDto(scene.Id, scene.Name, scene.UpdatedAt, scene.ParametersCapturedAt,
                scene.Parameters.Count, scene.Labels.Count, false);
        }

        public async Task RenameAsync(int id, string newName, int? userId, CancellationToken ct = default)
        {
            var name = CleanName(newName, MaxSceneName, "Scene name");
            await _gate.WaitAsync(ct);
            try
            {
                await using var db = await _db.CreateDbContextAsync(ct);
                var scene = await db.Scenes.FindAsync([id], ct) ?? throw new KeyNotFoundException("Scene not found.");
                if (await db.Scenes.AnyAsync(s => s.Name == name && s.Id != id, ct))
                    throw new ArgumentException($"A scene called \"{name}\" already exists.");
                scene.Name = name;
                Touch(scene, userId);
                await db.SaveChangesAsync(ct);
                if (id == _active.Id) await RefreshActiveAsync(db, ct);
            }
            finally
            {
                _gate.Release();
            }
        }

        public async Task DeleteAsync(int id, CancellationToken ct = default)
        {
            await _gate.WaitAsync(ct);
            try
            {
                await using var db = await _db.CreateDbContextAsync(ct);
                var scene = await db.Scenes.FindAsync([id], ct) ?? throw new KeyNotFoundException("Scene not found.");
                if (await db.Scenes.CountAsync(ct) <= 1)
                    throw new InvalidOperationException("The last scene can't be deleted.");

                db.Scenes.Remove(scene);
                await db.SaveChangesAsync(ct);

                if (id == _active.Id)
                {
                    // another scene takes over the fader names (labels only, nothing is sent to the console)
                    var next = await db.Scenes.OrderBy(s => s.Name).FirstAsync(ct);
                    var state = await db.AppState.FindAsync([1], ct);
                    state!.ActiveSceneId = next.Id;
                    await db.SaveChangesAsync(ct);
                    await RefreshActiveAsync(db, ct);
                }
                _logger.LogInformation("Scene {Name} deleted", scene.Name);
            }
            finally
            {
                _gate.Release();
            }
        }

        /// <summary>Replaces the scene's parameter snapshot with the current mixer values.</summary>
        public async Task<CaptureSceneResult> CaptureAsync(int id, int? userId, CancellationToken ct = default)
        {
            await using var db = await _db.CreateDbContextAsync(ct);
            var scene = await db.Scenes.FindAsync([id], ct) ?? throw new KeyNotFoundException("Scene not found.");
            var parameters = SnapshotParameters();

            await using var tx = await db.Database.BeginTransactionAsync(ct);
            await db.SceneParameters.Where(p => p.SceneId == id).ExecuteDeleteAsync(ct);
            foreach (var p in parameters) p.SceneId = id;
            db.SceneParameters.AddRange(parameters);
            scene.ParametersCapturedAt = DateTime.UtcNow;
            Touch(scene, userId);
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            _logger.LogInformation("Scene {Name}: captured {Count} parameters", scene.Name, parameters.Count);
            return new CaptureSceneResult(parameters.Count);
        }

        /// <summary>Makes the scene active for everyone; with mode "all" its parameters are sent to the console.</summary>
        public async Task<ActivateSceneResult> ActivateAsync(int id, string mode, CancellationToken ct = default)
        {
            bool recall = string.Equals(mode, SceneRecallModes.All, StringComparison.OrdinalIgnoreCase);
            if (!recall && !string.Equals(mode, SceneRecallModes.Labels, StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("Mode must be \"labels\" or \"all\".");

            await _gate.WaitAsync(ct);
            try
            {
                await using var db = await _db.CreateDbContextAsync(ct);
                if (!await db.Scenes.AnyAsync(s => s.Id == id, ct)) throw new KeyNotFoundException("Scene not found.");

                BehringerChange[] changes = [];
                if (recall)
                {
                    if (!_router.HasOutput)
                        throw new InvalidOperationException("No MIDI output is open: parameters can't be sent to the console.");
                    changes = await db.SceneParameters.AsNoTracking().Where(p => p.SceneId == id)
                        .Select(p => new BehringerChange(p.Module, p.Param, p.Value))
                        .ToArrayAsync(ct);
                    changes = changes.Where(c => c.IsValid()).ToArray();
                }

                var state = await db.AppState.FindAsync([1], ct);
                state!.ActiveSceneId = id;
                await db.SaveChangesAsync(ct);
                await RefreshActiveAsync(db, ct);

                // through the normal pipeline: state store, paced MIDI OUT, broadcast to every client
                if (changes.Length > 0) _bus.Publish(changes, ChangeSource.Client);

                _logger.LogInformation("Scene {Name} activated ({Mode}, {Count} parameters sent)", _active.Name, recall ? "all" : "labels", changes.Length);
                return new ActivateSceneResult(changes.Length, EstimateSeconds(changes.Length));
            }
            finally
            {
                _gate.Release();
            }
        }

        /// <summary>Sets (or clears, when the name is empty) the custom name of one module in a scene.</summary>
        public async Task SetLabelAsync(int sceneId, int module, SetLabelRequest request, int? userId, CancellationToken ct = default)
        {
            if (module is < 0 or > 0x7F) throw new ArgumentException("Module must be 0..127.");
            var name = (request.Name ?? "").Trim();
            if (name.Length > MaxLabelName) throw new ArgumentException($"Fader names can be at most {MaxLabelName} characters.");
            var color = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color.Trim();
            if (color != null && !System.Text.RegularExpressions.Regex.IsMatch(color, "^#[0-9a-fA-F]{6}$"))
                throw new ArgumentException("Color must look like #RRGGBB.");

            await _gate.WaitAsync(ct);
            try
            {
                await using var db = await _db.CreateDbContextAsync(ct);
                var scene = await db.Scenes.FindAsync([sceneId], ct) ?? throw new KeyNotFoundException("Scene not found.");
                var label = await db.SceneLabels.FindAsync([sceneId, module], ct);

                if (name.Length == 0 && color == null)
                {
                    if (label != null) db.SceneLabels.Remove(label);
                }
                else if (label == null)
                {
                    db.SceneLabels.Add(new SceneLabel { SceneId = sceneId, Module = module, Name = name, Color = color });
                }
                else
                {
                    label.Name = name;
                    label.Color = color;
                }
                Touch(scene, userId);
                await db.SaveChangesAsync(ct);
                if (sceneId == _active.Id) await RefreshActiveAsync(db, ct);
            }
            finally
            {
                _gate.Release();
            }
        }

        // ---------------- helpers ----------------

        private List<SceneParameter> SnapshotParameters() =>
            _state.Snapshot().Select(kv => new SceneParameter { Module = kv.Key.Module, Param = kv.Key.Param, Value = kv.Value }).ToList();

        private double EstimateSeconds(int count)
        {
            if (count == 0) return 0;
            int batches = (count + BehringerUtilities.MaxChangesPerSysEx - 1) / BehringerUtilities.MaxChangesPerSysEx;
            double bytes = batches * 9.0 + count * 4.0; // header + count + F7, 4 bytes per change
            return Math.Round(bytes / Math.Max(500, _config.GetValue("Midi:MaxBytesPerSecond", 3000.0)), 1);
        }

        private async Task RefreshActiveAsync(AppDbContext db, CancellationToken ct)
        {
            var state = await db.AppState.AsNoTracking().FirstAsync(ct);
            _active = await LoadActiveAsync(db, state.ActiveSceneId!.Value, ct);
            try { ActiveSceneChanged?.Invoke(_active); }
            catch (Exception ex) { _logger.LogWarning(ex, "ActiveSceneChanged handler failed"); }
        }

        private static async Task<ActiveSceneDto> LoadActiveAsync(AppDbContext db, int id, CancellationToken ct)
        {
            var scene = await db.Scenes.AsNoTracking().FirstAsync(s => s.Id == id, ct);
            var labels = await db.SceneLabels.AsNoTracking().Where(l => l.SceneId == id).OrderBy(l => l.Module)
                .Select(l => new SceneLabelDto(l.Module, l.Name, l.Color)).ToListAsync(ct);
            return new ActiveSceneDto(scene.Id, scene.Name, labels);
        }

        private static void Touch(Scene scene, int? userId)
        {
            scene.UpdatedAt = DateTime.UtcNow;
            scene.UpdatedByUserId = userId;
        }

        private static string CleanName(string? name, int max, string what)
        {
            var clean = (name ?? "").Trim();
            if (clean.Length == 0) throw new ArgumentException($"{what} is required.");
            if (clean.Length > max) throw new ArgumentException($"{what} can be at most {max} characters.");
            return clean;
        }
    }
}
