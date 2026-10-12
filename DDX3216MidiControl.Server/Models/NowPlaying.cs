namespace MidiInterface.Models
{
    /// <summary>
    /// What Spotify (raspotify / librespot on this Pi) is playing.
    /// State: "playing" | "paused". PositionMs is the position at the moment the message was built,
    /// so clients extrapolate from when they received it (no clock sync between Pi and phones needed).
    /// </summary>
    public record NowPlayingDto(
        string State,
        string? Title,
        IReadOnlyList<string> Artists,
        string? Album,
        IReadOnlyList<string> Covers,
        long DurationMs,
        long PositionMs,
        string? Device);

    /// <summary>NowPlaying is null when nothing is playing (stopped, or no Spotify session).</summary>
    public record WsNowPlayingMessage(NowPlayingDto? NowPlaying)
    {
        public string Type => "nowPlaying";
    }
}
