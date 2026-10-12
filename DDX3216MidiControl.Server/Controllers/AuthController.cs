using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using MidiInterface.Data;
using MidiInterface.Services;
using System.Security.Claims;

namespace MidiInterface.Controllers
{
    public record LoginRequest(string UserName, string Password);
    public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
    public record AuthUser(int Id, string UserName, string Role);
    public record AuthState(bool SetupRequired, AuthUser? User);

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        public const string StampClaim = "stamp";
        private readonly UserService _users;
        private readonly ILogger<AuthController> _logger;

        public AuthController(UserService users, ILogger<AuthController> logger)
        {
            _users = users;
            _logger = logger;
        }

        /// <summary>Who is logged in, and whether the first admin still has to be created.</summary>
        [HttpGet("state")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthState>> GetState(CancellationToken ct)
        {
            bool setup = !await _users.AnyUsersAsync(ct);
            return Ok(new AuthState(setup, User.Identity?.IsAuthenticated == true ? CurrentUser() : null));
        }

        /// <summary>Creates the first admin account (only while no users exist) and logs it in.</summary>
        [HttpPost("setup")]
        [AllowAnonymous]
        [EnableRateLimiting(RateLimits.Login)]
        public async Task<ActionResult<AuthUser>> Setup([FromBody] LoginRequest request, CancellationToken ct)
        {
            try
            {
                var user = await _users.CreateFirstAdminAsync(request.UserName, request.Password, ct);
                await SignInAsync(user);
                _logger.LogInformation("First admin {User} created", user.UserName);
                return Ok(new AuthUser(user.Id, user.UserName, user.Role));
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("login")]
        [AllowAnonymous]
        [EnableRateLimiting(RateLimits.Login)]
        public async Task<ActionResult<AuthUser>> Login([FromBody] LoginRequest request, CancellationToken ct)
        {
            var user = await _users.VerifyAsync(request.UserName ?? "", request.Password ?? "", ct);
            if (user == null)
            {
                _logger.LogWarning("Failed login for {User} from {Ip}", request.UserName, HttpContext.Connection.RemoteIpAddress);
                return Unauthorized("Wrong user name or password.");
            }
            await SignInAsync(user);
            return Ok(new AuthUser(user.Id, user.UserName, user.Role));
        }

        [HttpPost("logout")]
        [AllowAnonymous]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return NoContent();
        }

        [HttpPost("password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
        {
            try
            {
                var user = await _users.ChangeOwnPasswordAsync(User.GetUserId(), request.CurrentPassword ?? "", request.NewPassword ?? "", ct);
                await SignInAsync(user); // new security stamp: re-issue this device's cookie
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private AuthUser CurrentUser() =>
            new(User.GetUserId(), User.Identity?.Name ?? "", User.FindFirstValue(ClaimTypes.Role) ?? Roles.Viewer);

        private Task SignInAsync(User user)
        {
            var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim(StampClaim, user.SecurityStamp),
            ], CookieAuthenticationDefaults.AuthenticationScheme);

            return HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity),
                new AuthenticationProperties { IsPersistent = true });
        }
    }

    public static class RateLimits
    {
        public const string Login = "login";
    }

    public static class ClaimsPrincipalExtensions
    {
        public static int GetUserId(this ClaimsPrincipal user) =>
            int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
    }
}
