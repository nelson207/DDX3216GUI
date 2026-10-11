namespace MidiInterface.Models
{
    public record SceneLabelDto(int Module, string Name, string? Color);

    /// <summary>The scene everyone is on: its fader names.</summary>
    public record ActiveSceneDto(int Id, string Name, IReadOnlyList<SceneLabelDto> Labels);

    public record SceneSummaryDto(
        int Id,
        string Name,
        DateTime UpdatedAt,
        DateTime? ParametersCapturedAt,
        int ParameterCount,
        int LabelCount,
        bool IsActive);

    public record CreateSceneRequest(string Name, bool CaptureParameters = false, int? CopyLabelsFromSceneId = null);
    public record RenameSceneRequest(string Name);

    /// <summary>Mode "labels": only switch fader names. Mode "all": also send the saved parameters to the console.</summary>
    public record ActivateSceneRequest(string Mode = SceneRecallModes.Labels);

    public static class SceneRecallModes
    {
        public const string Labels = "labels";
        public const string All = "all";
    }

    public record SetLabelRequest(string? Name, string? Color);

    public record ActivateSceneResult(int ParametersSent, double EstimatedSeconds);
    public record CaptureSceneResult(int ParametersCaptured);

    public record WsSceneMessage(ActiveSceneDto Scene)
    {
        public string Type => "scene";
    }
}
