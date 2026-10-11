using MidiInterface.Models;
using System.Text.Json;

namespace MidiInterface.Services
{
    /// <summary>Persists the selected MIDI ports (by name) and channel to a small JSON file.</summary>
    public sealed class MidiSettingsStore
    {
        private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web) { WriteIndented = true };
        private readonly string _path;
        private readonly ILogger<MidiSettingsStore> _logger;
        private readonly object _gate = new();

        public MidiSettingsStore(IConfiguration config, IHostEnvironment env, ILogger<MidiSettingsStore> logger)
        {
            _logger = logger;
            _path = config["Midi:SettingsPath"] is { Length: > 0 } p
                ? p
                : Path.Combine(config["DataDirectory"] is { Length: > 0 } d ? d : Path.Combine(env.ContentRootPath, "App_Data"),
                    "midi-settings.json");
        }

        public MidiSettings Load()
        {
            lock (_gate)
            {
                try
                {
                    if (File.Exists(_path))
                        return JsonSerializer.Deserialize<MidiSettings>(File.ReadAllText(_path), Json) ?? new(null, null);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not read MIDI settings from {Path}", _path);
                }
                return new(null, null);
            }
        }

        public void Save(MidiSettings settings)
        {
            lock (_gate)
            {
                try
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
                    // write + rename so a power cut can't leave a half-written file
                    var tmp = _path + ".tmp";
                    File.WriteAllText(tmp, JsonSerializer.Serialize(settings, Json));
                    File.Move(tmp, _path, overwrite: true);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not save MIDI settings to {Path}", _path);
                }
            }
        }
    }
}
