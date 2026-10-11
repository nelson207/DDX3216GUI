namespace MidiInterface.Models
{
    /// <summary>
    /// WebSocket protocol (JSON, camelCase envelope):
    ///   client -> server: {type:"changes", changes:[{Module,Param,Value}]} | {type:"ping"}
    ///                     (a bare [{Module,Param,Value}] array is still accepted)
    ///   server -> client: {type:"snapshot"|"changes", changes:[...]} | {type:"status", status:{...}}
    ///                     {type:"error", message} | {type:"pong"}
    /// </summary>
    public static class WsMessageTypes
    {
        public const string Changes = "changes";
        public const string Snapshot = "snapshot";
        public const string Status = "status";
        public const string Error = "error";
        public const string Ping = "ping";
        public const string Pong = "pong";
    }

    public record WsChangesMessage(string Type, IReadOnlyList<BehringerChange> Changes);

    public record WsStatusMessage(MidiDevices Status)
    {
        public string Type => WsMessageTypes.Status;
    }

    public record WsErrorMessage(string Message)
    {
        public string Type => WsMessageTypes.Error;
    }

    public record WsPongMessage
    {
        public string Type => WsMessageTypes.Pong;
    }
}
