using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MidiInterface.Models;
using MidiInterface.Services;

namespace MidiInterface.Controllers
{
    /// <summary>App-side scenes: fader names (labels) and optional parameter snapshots.</summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ScenesController : ControllerBase
    {
        private readonly SceneService _scenes;

        public ScenesController(SceneService scenes) => _scenes = scenes;

        [HttpGet]
        public async Task<ActionResult<List<SceneSummaryDto>>> List(CancellationToken ct) => Ok(await _scenes.ListAsync(ct));

        /// <summary>The scene everyone is on, with its fader names (also pushed over the WebSocket).</summary>
        [HttpGet("active")]
        public ActionResult<ActiveSceneDto> Active() => Ok(_scenes.Active);

        [HttpPost]
        [Authorize(Policy = Policies.CanOperate)]
        public Task<ActionResult<SceneSummaryDto>> Create([FromBody] CreateSceneRequest request, CancellationToken ct) =>
            Run(() => _scenes.CreateAsync(request, User.GetUserId(), ct));

        [HttpPut("{id:int}")]
        [Authorize(Policy = Policies.CanOperate)]
        public Task<ActionResult<object>> Rename([FromRoute] int id, [FromBody] RenameSceneRequest request, CancellationToken ct) =>
            Run<object>(async () => { await _scenes.RenameAsync(id, request.Name, User.GetUserId(), ct); return new { id }; });

        [HttpDelete("{id:int}")]
        [Authorize(Policy = Policies.CanOperate)]
        public Task<ActionResult<object>> Delete([FromRoute] int id, CancellationToken ct) =>
            Run<object>(async () => { await _scenes.DeleteAsync(id, ct); return new { id }; });

        /// <summary>Saves the current mixer values into the scene (replacing its previous snapshot).</summary>
        [HttpPost("{id:int}/capture")]
        [Authorize(Policy = Policies.CanOperate)]
        public Task<ActionResult<CaptureSceneResult>> Capture([FromRoute] int id, CancellationToken ct) =>
            Run(() => _scenes.CaptureAsync(id, User.GetUserId(), ct));

        /// <summary>Makes the scene active for everyone. Mode "labels" (names only) or "all" (also sends its parameters).</summary>
        [HttpPost("{id:int}/activate")]
        [Authorize(Policy = Policies.CanOperate)]
        public Task<ActionResult<ActivateSceneResult>> Activate([FromRoute] int id, [FromBody] ActivateSceneRequest request, CancellationToken ct) =>
            Run(() => _scenes.ActivateAsync(id, request.Mode, ct));

        /// <summary>Sets a module's name/colour in a scene; an empty name and colour removes it.</summary>
        [HttpPut("{id:int}/labels/{module:int}")]
        [Authorize(Policy = Policies.CanOperate)]
        public Task<ActionResult<object>> SetLabel([FromRoute] int id, [FromRoute] int module, [FromBody] SetLabelRequest request, CancellationToken ct) =>
            Run<object>(async () => { await _scenes.SetLabelAsync(id, module, request, User.GetUserId(), ct); return new { id, module }; });

        /// <summary>
        /// Stereo-pairs (or unpairs) input channel <paramref name="module"/> with its neighbour
        /// (C1+C2, C3+C4 …; either channel of the pair can be given). Pairing the active scene copies the
        /// odd channel's settings to the even one and pans them hard left / hard right.
        /// </summary>
        [HttpPut("{id:int}/pairs/{module:int}")]
        [Authorize(Policy = Policies.CanOperate)]
        public Task<ActionResult<SetPairResult>> SetPair([FromRoute] int id, [FromRoute] int module, [FromBody] SetPairRequest request, CancellationToken ct) =>
            Run(() => _scenes.SetPairAsync(id, module, request.Paired, User.GetUserId(), ct));

        private async Task<ActionResult<T>> Run<T>(Func<Task<T>> action)
        {
            try
            {
                return Ok(await action());
            }
            catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
            catch (InvalidOperationException ex) { return Conflict(ex.Message); }
            catch (ArgumentException ex) { return BadRequest(ex.Message); }
        }
    }

    public static class Policies
    {
        public const string CanOperate = "CanOperate";
    }
}
