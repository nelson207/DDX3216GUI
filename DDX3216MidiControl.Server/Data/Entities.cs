namespace MidiInterface.Data
{
    public static class Roles
    {
        /// <summary>Everything, including user management.</summary>
        public const string Admin = "Admin";
        /// <summary>Controls the mixer, MIDI setup, scenes and fader names.</summary>
        public const string Operator = "Operator";
        /// <summary>Read-only: sees the mixer but cannot change anything.</summary>
        public const string Viewer = "Viewer";

        public static readonly string[] All = [Admin, Operator, Viewer];

        public static bool CanOperate(string? role) => role is Admin or Operator;
    }

    public class User
    {
        public int Id { get; set; }
        public string UserName { get; set; } = "";
        public string PasswordHash { get; set; } = "";
        public string Role { get; set; } = Roles.Operator;
        /// <summary>Changes on password/role change: invalidates existing login cookies.</summary>
        public string SecurityStamp { get; set; } = Guid.NewGuid().ToString("N");
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>App-side scene: fader names (labels) and, optionally, a full parameter snapshot.</summary>
    public class Scene
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public int? UpdatedByUserId { get; set; }
        /// <summary>When the parameter snapshot was last captured (null = labels only).</summary>
        public DateTime? ParametersCapturedAt { get; set; }

        public List<SceneLabel> Labels { get; set; } = new();
        public List<SceneParameter> Parameters { get; set; } = new();
    }

    /// <summary>Custom name (and colour) of one module (channel/bus/aux/fx/main) in a scene.</summary>
    public class SceneLabel
    {
        public int SceneId { get; set; }
        public int Module { get; set; }
        public string Name { get; set; } = "";
        public string? Color { get; set; }
    }

    public class SceneParameter
    {
        public int SceneId { get; set; }
        public int Module { get; set; }
        public int Param { get; set; }
        public double Value { get; set; }
    }

    /// <summary>Last known mixer values, persisted so they survive server restarts.</summary>
    public class LiveParameter
    {
        public int Module { get; set; }
        public int Param { get; set; }
        public double Value { get; set; }
    }

    /// <summary>Single row (Id = 1): app-wide state such as the active scene.</summary>
    public class AppState
    {
        public int Id { get; set; } = 1;
        public int? ActiveSceneId { get; set; }
    }
}
