using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveWinningLineColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Supprimer uniquement la colonne WinningLine de la table Games
            migrationBuilder.DropColumn(
                name: "WinningLine",
                table: "Games");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Recréer la colonne WinningLine si on annule la migration
            migrationBuilder.AddColumn<int[]>(
                name: "WinningLine",
                table: "Games",
                type: "jsonb",
                nullable: true);
        }
    }
}
