using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MidiInterface.Data;
using MidiInterface.Services;

namespace MidiInterface.Controllers
{
    public record CreateUserRequest(string UserName, string Password, string Role);
    public record UpdateUserRequest(string? Role, string? Password);

    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = Roles.Admin)]
    public class UsersController : ControllerBase
    {
        private readonly UserService _users;

        public UsersController(UserService users) => _users = users;

        [HttpGet]
        public async Task<ActionResult<List<UserDto>>> List(CancellationToken ct) => Ok(await _users.ListAsync(ct));

        [HttpPost]
        public Task<ActionResult<UserDto>> Create([FromBody] CreateUserRequest request, CancellationToken ct) =>
            Run<UserDto>(async () =>
            {
                var u = await _users.CreateAsync(request.UserName, request.Password, request.Role, ct);
                return new UserDto(u.Id, u.UserName, u.Role, u.CreatedAt);
            });

        [HttpPut("{id:int}")]
        public Task<ActionResult<object>> Update([FromRoute] int id, [FromBody] UpdateUserRequest request, CancellationToken ct) =>
            Run<object>(async () =>
            {
                await _users.UpdateAsync(id, request.Role, request.Password, User.GetUserId(), ct);
                return new { id };
            });

        [HttpDelete("{id:int}")]
        public Task<ActionResult<object>> Delete([FromRoute] int id, CancellationToken ct) =>
            Run<object>(async () =>
            {
                await _users.DeleteAsync(id, User.GetUserId(), ct);
                return new { id };
            });

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
}
