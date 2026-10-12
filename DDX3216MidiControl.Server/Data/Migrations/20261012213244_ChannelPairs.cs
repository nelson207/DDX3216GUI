using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DDX3216MidiControl.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class ChannelPairs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SceneChannelPairs",
                columns: table => new
                {
                    SceneId = table.Column<int>(type: "INTEGER", nullable: false),
                    Module = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SceneChannelPairs", x => new { x.SceneId, x.Module });
                    table.ForeignKey(
                        name: "FK_SceneChannelPairs_Scenes_SceneId",
                        column: x => x.SceneId,
                        principalTable: "Scenes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SceneChannelPairs");
        }
    }
}
