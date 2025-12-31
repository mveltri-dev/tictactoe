using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Database;

public class TicTacToeDbContext : DbContext
{
    public TicTacToeDbContext(DbContextOptions<TicTacToeDbContext> options) : base(options)
    {
    }

    public DbSet<Game> Games { get; set; }
    public DbSet<Player> Players { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Applique automatiquement toutes les configurations IEntityTypeConfiguration
        // de l'assembly actuel (Infrastructure)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TicTacToeDbContext).Assembly);
    }
}
