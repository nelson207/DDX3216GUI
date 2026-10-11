using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MidiInterface.Models;
using MidiInterface.Services;

namespace MidiInterface.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MidiController : ControllerBase
    {
        private readonly ILogger<MidiController> _logger;
        private readonly MidiRouterService _router;
        private readonly BehringerStateStoreService _stateStore;

        public MidiController(ILogger<MidiController> logger, MidiRouterService router, BehringerStateStoreService stateStore)
        {
            _router = router;
            _logger = logger;
            _stateStore = stateStore;
        }

        /// <summary>Ports, selection (resolved from the saved names), connection state and channel.</summary>
        [HttpGet("devices")]
        public ActionResult<MidiDevices> GetDevices() => Ok(_router.GetStatus());

        /// <summary>Last known value of one parameter, or <paramref name="defaultValue"/> when unknown.</summary>
        [HttpGet("status/{module:int}/{param:int}/{defaultValue:int}")]
        public ActionResult<double> GetModuleStatus([FromRoute] int module, [FromRoute] int param, [FromRoute] int defaultValue)
        {
            if (_stateStore.TryGet(module, param, out double value))
                return Ok(value);
            return Ok(defaultValue);
        }

        /// <summary>Every known parameter value (same data the WebSocket "snapshot" carries).</summary>
        [HttpGet("state")]
        public ActionResult<IEnumerable<BehringerChange>> GetState() =>
            Ok(_stateStore.Snapshot().Select(kv => new BehringerChange(kv.Key.Module, kv.Key.Param, kv.Value)));

        [HttpPost("out/select/{index:int}")]
        [Authorize(Policy = Policies.CanOperate)]
        public IActionResult SelectOut([FromRoute] int index) => Run(() => _router.SelectOut(index), new { selectedOut = index }, "select MIDI OUT");

        [HttpPost("in/select/{index:int}")]
        [Authorize(Policy = Policies.CanOperate)]
        public IActionResult SelectIn([FromRoute] int index) => Run(() => _router.SelectIn(index), new { selectedIn = index }, "select MIDI IN");

        [HttpPost("channel/{channel:int}")]
        [Authorize(Policy = Policies.CanOperate)]
        public IActionResult SetChannel([FromRoute] int channel) => Run(() => _router.SetChannel(channel), new { channel }, "set MIDI channel");

        [HttpPost("devices/refresh")]
        [Authorize(Policy = Policies.CanOperate)]
        public IActionResult RefreshDevices() => Run(_router.RefreshDevices, new { }, "refresh MIDI devices");

        private IActionResult Run(Action action, object result, string what)
        {
            try
            {
                action();
                return Ok(result);
            }
            catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to {What}", what);
                return BadRequest($"Failed to {what}: {ex.Message}");
            }
        }
    }
}
