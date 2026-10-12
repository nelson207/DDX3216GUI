using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MidiInterface.Models;
using MidiInterface.Services;

namespace MidiInterface.Controllers
{
    /// <summary>Spotify "now playing" from raspotify on the same Pi.</summary>
    [ApiController]
    [Route("api/[controller]")]
    public class NowPlayingController : ControllerBase
    {
        private readonly NowPlayingService _nowPlaying;

        public NowPlayingController(NowPlayingService nowPlaying) => _nowPlaying = nowPlaying;

        /// <summary>What is playing (also pushed over the WebSocket); 204 when nothing is.</summary>
        [HttpGet]
        [Authorize]
        public ActionResult<NowPlayingDto> Get() => _nowPlaying.Current is { } np ? Ok(np) : NoContent();

        /// <summary>
        /// librespot event hook (deploy/raspotify/ddx3216-spotify-event): the event's variables as a flat
        /// JSON object, e.g. {"PLAYER_EVENT":"track_changed","NAME":"…"}. Only accepted from the Pi itself,
        /// never through nginx (forwarded requests carry the real client address).
        /// </summary>
        [HttpPost("events")]
        [AllowAnonymous]
        [ApiExplorerSettings(IgnoreApi = true)]
        public IActionResult Event([FromBody] Dictionary<string, string> e)
        {
            var remote = HttpContext.Connection.RemoteIpAddress;
            if (remote == null || !System.Net.IPAddress.IsLoopback(remote) || Request.Headers.ContainsKey("X-Original-For"))
                return StatusCode(StatusCodes.Status403Forbidden);
            _nowPlaying.Apply(e);
            return NoContent();
        }
    }
}
