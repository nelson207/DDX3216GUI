using MidiInterface.Models;

namespace MidiInterface.Services
{
    /// <summary>
    /// Tracks the Spotify player from librespot's event hook (raspotify LIBRESPOT_ONEVENT).
    /// librespot runs the hook with PLAYER_EVENT and event-specific variables; the hook forwards them
    /// here as a flat JSON object. Only events that change what is shown are handled.
    /// </summary>
    public sealed class NowPlayingService
    {
        private readonly object _lock = new();
        private readonly ILogger<NowPlayingService> _logger;

        private string? _trackId;
        private string? _title;
        private string[] _artists = [];
        private string? _album;
        private string[] _covers = [];
        private long _durationMs;
        private long _positionMs;
        private DateTime _positionAt = DateTime.UtcNow;
        private bool _active;   // playing or paused
        private bool _playing;
        private string? _device; // Spotify app that controls the session ("Pixel 8", "Living room PC" …)

        public NowPlayingService(ILogger<NowPlayingService> logger) => _logger = logger;

        /// <summary>Raised with the new state (null = nothing playing) after every visible change.</summary>
        public event Action<NowPlayingDto?>? Changed;

        public NowPlayingDto? Current
        {
            get { lock (_lock) return BuildLocked(); }
        }

        public void Apply(IReadOnlyDictionary<string, string> e)
        {
            var name = Get(e, "PLAYER_EVENT");
            if (name == null) return;

            NowPlayingDto? snapshot;
            lock (_lock)
            {
                switch (name)
                {
                    case "track_changed":
                        _trackId = Get(e, "TRACK_ID") ?? Get(e, "URI");
                        // podcasts: episode name + show name instead of artists
                        _title = Get(e, "NAME");
                        _artists = Get(e, "ITEM_TYPE") == "Episode" && Get(e, "SHOW_NAME") is { } show ? [show] : Lines(e, "ARTISTS");
                        _album = Get(e, "ALBUM");
                        _covers = Lines(e, "COVERS");
                        _durationMs = Long(e, "DURATION_MS") ?? 0;
                        SetPosition(0);
                        break;
                    case "playing":
                    case "paused":
                        // a different track without track_changed (e.g. the hook started mid-song): drop stale metadata
                        if (Get(e, "TRACK_ID") is { } id && _trackId != null && id != _trackId) ClearTrack();
                        _trackId ??= Get(e, "TRACK_ID");
                        _active = true;
                        _playing = name == "playing";
                        SetPosition(Long(e, "POSITION_MS") ?? PositionLocked());
                        break;
                    case "seeked":
                    case "position_correction":
                        SetPosition(Long(e, "POSITION_MS") ?? PositionLocked());
                        break;
                    case "session_client_changed":
                        _device = Get(e, "CLIENT_NAME") ?? _device;
                        break;
                    case "stopped":
                        _active = _playing = false;
                        break;
                    case "session_disconnected":
                        ClearTrack();
                        _active = _playing = false;
                        _device = null;
                        break;
                    default:
                        return; // loading, preloading, volume_changed, … don't change the display
                }
                snapshot = BuildLocked();
            }

            _logger.LogDebug("Spotify {Event}: {Title}", name, snapshot?.Title);
            try { Changed?.Invoke(snapshot); }
            catch (Exception ex) { _logger.LogError(ex, "NowPlaying listener failed"); }
        }

        private NowPlayingDto? BuildLocked() =>
            _active && (_title != null || _trackId != null)
                ? new NowPlayingDto(_playing ? "playing" : "paused", _title, _artists, _album, _covers, _durationMs, PositionLocked(), _device)
                : null;

        private long PositionLocked()
        {
            var pos = _playing ? _positionMs + (long)(DateTime.UtcNow - _positionAt).TotalMilliseconds : _positionMs;
            return _durationMs > 0 ? Math.Min(pos, _durationMs) : pos;
        }

        private void SetPosition(long ms)
        {
            _positionMs = Math.Max(0, ms);
            _positionAt = DateTime.UtcNow;
        }

        private void ClearTrack()
        {
            _trackId = _title = _album = null;
            _artists = _covers = [];
            _durationMs = 0;
            SetPosition(0);
        }

        private static string? Get(IReadOnlyDictionary<string, string> e, string key) =>
            e.TryGetValue(key, out var v) && !string.IsNullOrWhiteSpace(v) ? v.Trim() : null;

        private static long? Long(IReadOnlyDictionary<string, string> e, string key) =>
            long.TryParse(Get(e, key), out var v) ? v : null;

        // librespot joins lists (artists, cover URLs) with newlines
        private static string[] Lines(IReadOnlyDictionary<string, string> e, string key) =>
            Get(e, key)?.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries) ?? [];
    }
}
