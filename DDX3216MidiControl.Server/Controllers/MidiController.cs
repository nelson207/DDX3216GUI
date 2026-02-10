using Microsoft.AspNetCore.Mvc;
using MidiInterface.Models;
using MidiInterface.Services;

namespace MidiInterface.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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

        // List devices
        [HttpGet("devices")]
        public ActionResult<MidiDevices> GetDevices()
        {
            return Ok(new MidiDevices(_router.SelectedInDevice, _router.SelectedOutDevice, _router.Channel));
        }

        [HttpGet("status/{module:int}/{param:int}/{defaultValue:int}")]
        public ActionResult<double> GetModuleStatus([FromRoute] int module, [FromRoute] int param, [FromRoute] int defaultValue)
        {
            if (_stateStore.TryGet(module, param, out double value))
                return Ok(value);
            return Ok(defaultValue);
        }

        // Select MIDI OUT
        [HttpPost("out/select/{index:int}")]
        public IActionResult SelectOut([FromRoute] int index)
        {
            try
            {
                _router.SelectOut(index);
                return Ok(new { seleindexctedOut = index });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Select MIDI IN
        [HttpPost("in/select/{index:int}")]
        public IActionResult SelectIn([FromRoute] int index)
        {
            try
            {
                _router.SelectIn(index);
                return Ok(new { selectedIn = index });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Set channel (1..16)
        [HttpPost("channel/{channel:int}")]
        public IActionResult SetChannel([FromRoute] int channel)
        {
            try
            {
                _router.SetChannel(channel);
                return Ok(new { channel });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("devices/refresh")]
        public IActionResult RefreshDevices()
        {
            try
            {
                MidiRouterService.RefreshDeviceList();
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
