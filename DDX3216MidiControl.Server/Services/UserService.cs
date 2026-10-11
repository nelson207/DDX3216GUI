using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MidiInterface.Data;
using System.Text.RegularExpressions;

namespace MidiInterface.Services
{
    public record UserDto(int Id, string UserName, string Role, DateTime CreatedAt);

    /// <summary>Users, password hashing (ASP.NET Core PasswordHasher, PBKDF2) and role rules.</summary>
    public sealed partial class UserService
    {
        public const int MinPasswordLength = 6;
        private readonly IDbContextFactory<AppDbContext> _db;
        private readonly PasswordHasher<User> _hasher = new();

        /// <summary>Raised when a user's sessions must end (deleted, role or password changed).</summary>
        public event Action<int>? SessionsInvalidated;

        public UserService(IDbContextFactory<AppDbContext> db) => _db = db;

        public async Task<bool> AnyUsersAsync(CancellationToken ct = default)
        {
            await using var db = await _db.CreateDbContextAsync(ct);
            return await db.Users.AnyAsync(ct);
        }

        public async Task<User?> FindAsync(int id, CancellationToken ct = default)
        {
            await using var db = await _db.CreateDbContextAsync(ct);
            return await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);
        }

        public async Task<List<UserDto>> ListAsync(CancellationToken ct = default)
        {
            await using var db = await _db.CreateDbContextAsync(ct);
            return await db.Users.AsNoTracking().OrderBy(u => u.UserName)
                .Select(u => new UserDto(u.Id, u.UserName, u.Role, u.CreatedAt)).ToListAsync(ct);
        }

        /// <summary>Returns the user when the password matches (rehashing old hash formats).</summary>
        public async Task<User?> VerifyAsync(string userName, string password, CancellationToken ct = default)
        {
            await using var db = await _db.CreateDbContextAsync(ct);
            var user = await db.Users.FirstOrDefaultAsync(u => u.UserName == userName.Trim(), ct);
            if (user == null)
            {
                _hasher.HashPassword(new User(), password); // same cost as a real check: no user enumeration by timing
                return null;
            }
            var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, password);
            if (result == PasswordVerificationResult.Failed) return null;
            if (result == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.PasswordHash = _hasher.HashPassword(user, password);
                await db.SaveChangesAsync(ct);
            }
            return user;
        }

        public async Task<User> CreateAsync(string userName, string password, string role, CancellationToken ct = default)
        {
            var name = CleanUserName(userName);
            ValidatePassword(password);
            ValidateRole(role);
            await using var db = await _db.CreateDbContextAsync(ct);
            if (await db.Users.AnyAsync(u => u.UserName == name, ct))
                throw new ArgumentException($"User \"{name}\" already exists.");
            var user = new User { UserName = name, Role = role };
            user.PasswordHash = _hasher.HashPassword(user, password);
            db.Users.Add(user);
            await db.SaveChangesAsync(ct);
            return user;
        }

        /// <summary>Creates the first admin; only allowed while there are no users at all.</summary>
        public async Task<User> CreateFirstAdminAsync(string userName, string password, CancellationToken ct = default)
        {
            if (await AnyUsersAsync(ct)) throw new InvalidOperationException("Setup is already done.");
            return await CreateAsync(userName, password, Roles.Admin, ct);
        }

        public async Task UpdateAsync(int id, string? role, string? newPassword, int actingUserId, CancellationToken ct = default)
        {
            await using var db = await _db.CreateDbContextAsync(ct);
            var user = await db.Users.FindAsync([id], ct) ?? throw new KeyNotFoundException("User not found.");

            if (role != null && role != user.Role)
            {
                ValidateRole(role);
                if (user.Role == Roles.Admin && !await OtherAdminExistsAsync(db, id, ct))
                    throw new InvalidOperationException("There must be at least one admin.");
                user.Role = role;
            }
            if (!string.IsNullOrEmpty(newPassword))
            {
                ValidatePassword(newPassword);
                user.PasswordHash = _hasher.HashPassword(user, newPassword);
            }
            user.SecurityStamp = Guid.NewGuid().ToString("N");
            await db.SaveChangesAsync(ct);
            // the acting admin changing their own password stays logged in (the cookie is re-issued by the caller)
            if (id != actingUserId || role != null) SessionsInvalidated?.Invoke(id);
        }

        public async Task<User> ChangeOwnPasswordAsync(int id, string currentPassword, string newPassword, CancellationToken ct = default)
        {
            await using var db = await _db.CreateDbContextAsync(ct);
            var user = await db.Users.FindAsync([id], ct) ?? throw new KeyNotFoundException("User not found.");
            if (_hasher.VerifyHashedPassword(user, user.PasswordHash, currentPassword) == PasswordVerificationResult.Failed)
                throw new UnauthorizedAccessException("Current password is wrong.");
            ValidatePassword(newPassword);
            user.PasswordHash = _hasher.HashPassword(user, newPassword);
            user.SecurityStamp = Guid.NewGuid().ToString("N");
            await db.SaveChangesAsync(ct);
            return user;
        }

        public async Task DeleteAsync(int id, int actingUserId, CancellationToken ct = default)
        {
            if (id == actingUserId) throw new InvalidOperationException("You can't delete your own account.");
            await using var db = await _db.CreateDbContextAsync(ct);
            var user = await db.Users.FindAsync([id], ct) ?? throw new KeyNotFoundException("User not found.");
            if (user.Role == Roles.Admin && !await OtherAdminExistsAsync(db, id, ct))
                throw new InvalidOperationException("There must be at least one admin.");
            db.Users.Remove(user);
            await db.SaveChangesAsync(ct);
            SessionsInvalidated?.Invoke(id);
        }

        private static Task<bool> OtherAdminExistsAsync(AppDbContext db, int exceptId, CancellationToken ct) =>
            db.Users.AnyAsync(u => u.Role == Roles.Admin && u.Id != exceptId, ct);

        [GeneratedRegex(@"^[A-Za-z0-9._-]{2,32}$")]
        private static partial Regex UserNamePattern();

        private static string CleanUserName(string? userName)
        {
            var name = (userName ?? "").Trim();
            if (!UserNamePattern().IsMatch(name))
                throw new ArgumentException("User name: 2-32 characters, letters, digits, '.', '_' or '-'.");
            return name;
        }

        private static void ValidatePassword(string? password)
        {
            if (string.IsNullOrEmpty(password) || password.Length < MinPasswordLength)
                throw new ArgumentException($"Password must be at least {MinPasswordLength} characters.");
            if (password.Length > 128) throw new ArgumentException("Password is too long.");
        }

        private static void ValidateRole(string role)
        {
            if (!Roles.All.Contains(role)) throw new ArgumentException($"Role must be one of: {string.Join(", ", Roles.All)}.");
        }
    }
}
