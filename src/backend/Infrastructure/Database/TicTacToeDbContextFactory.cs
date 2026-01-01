using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using DotNetEnv;

namespace Infrastructure.Database;

/// <summary>
/// Factory pour créer le DbContext au moment du design (migrations EF Core).
/// Cette classe permet à 'dotnet ef' de créer le DbContext en chargeant le fichier .env.
/// </summary>
public class TicTacToeDbContextFactory : IDesignTimeDbContextFactory<TicTacToeDbContext>
{
    public TicTacToeDbContext CreateDbContext(string[] args)
    {
        // Charger le fichier .env depuis la racine du projet
        var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", ".env");
        Env.Load(envPath);

        var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException("DATABASE_URL n'est pas définie dans le fichier .env");
        }

        var optionsBuilder = new DbContextOptionsBuilder<TicTacToeDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new TicTacToeDbContext(optionsBuilder.Options);
    }
}
