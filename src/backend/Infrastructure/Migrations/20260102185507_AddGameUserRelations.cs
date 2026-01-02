using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGameUserRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Games_PlayerOId",
                table: "Games",
                column: "PlayerOId");

            migrationBuilder.CreateIndex(
                name: "IX_Games_PlayerXId",
                table: "Games",
                column: "PlayerXId");

            migrationBuilder.AddForeignKey(
                name: "FK_Games_Users_PlayerOId",
                table: "Games",
                column: "PlayerOId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Games_Users_PlayerXId",
                table: "Games",
                column: "PlayerXId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Games_Users_PlayerOId",
                table: "Games");

            migrationBuilder.DropForeignKey(
                name: "FK_Games_Users_PlayerXId",
                table: "Games");

            migrationBuilder.DropIndex(
                name: "IX_Games_PlayerOId",
                table: "Games");

            migrationBuilder.DropIndex(
                name: "IX_Games_PlayerXId",
                table: "Games");
        }
    }
}
