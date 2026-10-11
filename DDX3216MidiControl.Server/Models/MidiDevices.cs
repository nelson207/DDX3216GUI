namespace MidiInterface.Models
{
    public record MidiDeviceInfoPortName(uint Index, string Name);

    /// <summary>
    /// MIDI status as seen by clients (REST /api/Midi/devices and WebSocket "status").
    /// Selected* are indexes into the current port lists, resolved from the saved port names.
    /// </summary>
    public record MidiDevices(
        IReadOnlyList<MidiDeviceInfoPortName> InDevices,
        IReadOnlyList<MidiDeviceInfoPortName> OutDevices,
        int? SelectedInDevice,
        int? SelectedOutDevice,
        int Channel,
        string? SelectedInName,
        string? SelectedOutName,
        bool InConnected,
        bool OutConnected);

    /// <summary>
    /// Persisted selection. Ports are matched by name (survives restarts and USB re-plugs); the
    /// index is only a fallback for drivers that report unreadable names.
    /// </summary>
    public record MidiSettings(string? InName, string? OutName, int Channel = 1, uint? InIndex = null, uint? OutIndex = null);
}
