using Microsoft.EntityFrameworkCore;

namespace MidiInterface.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Scene> Scenes => Set<Scene>();
        public DbSet<SceneLabel> SceneLabels => Set<SceneLabel>();
        public DbSet<SceneParameter> SceneParameters => Set<SceneParameter>();
        public DbSet<LiveParameter> LiveParameters => Set<LiveParameter>();
        public DbSet<AppState> AppState => Set<AppState>();

        protected override void OnModelCreating(ModelBuilder b)
        {
            b.Entity<User>(e =>
            {
                e.Property(u => u.UserName).HasMaxLength(64).UseCollation("NOCASE");
                e.HasIndex(u => u.UserName).IsUnique();
                e.Property(u => u.Role).HasMaxLength(16);
                e.Property(u => u.SecurityStamp).HasMaxLength(64);
            });

            b.Entity<Scene>(e =>
            {
                e.Property(s => s.Name).HasMaxLength(64).UseCollation("NOCASE");
                e.HasIndex(s => s.Name).IsUnique();
                e.HasMany(s => s.Labels).WithOne().HasForeignKey(l => l.SceneId).OnDelete(DeleteBehavior.Cascade);
                e.HasMany(s => s.Parameters).WithOne().HasForeignKey(p => p.SceneId).OnDelete(DeleteBehavior.Cascade);
            });

            b.Entity<SceneLabel>(e =>
            {
                e.HasKey(l => new { l.SceneId, l.Module });
                e.Property(l => l.Name).HasMaxLength(32);
                e.Property(l => l.Color).HasMaxLength(16);
            });

            b.Entity<SceneParameter>(e => e.HasKey(p => new { p.SceneId, p.Module, p.Param }));
            b.Entity<LiveParameter>(e => e.HasKey(p => new { p.Module, p.Param }));

            b.Entity<AppState>(e =>
            {
                e.Property(s => s.Id).ValueGeneratedNever();
                e.HasOne<Scene>().WithMany().HasForeignKey(s => s.ActiveSceneId).OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}
