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
        // Charger le fichier .env depuis le dossier backend
        var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
        Env.Load(envPath);

        var host = Environment.GetEnvironmentVariable("DB_HOST");
        var user = Environment.GetEnvironmentVariable("DB_USER");
        var database = Environment.GetEnvironmentVariable("DB_NAME");
        var password = Environment.GetEnvironmentVariable("DB_PASSWORD");
        var port = Environment.GetEnvironmentVariable("DB_PORT");

        if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(user) || 
            string.IsNullOrEmpty(database) || string.IsNullOrEmpty(password))
        {
            throw new InvalidOperationException("Les variables DB_HOST, DB_USER, DB_NAME et DB_PASSWORD doivent être définies dans le fichier .env");
        }

        var connectionString = $"Host={host};Port={port ?? "5432"};Database={database};Username={user};Password={password};SSL Mode=Require;Trust Server Certificate=true";

        var optionsBuilder = new DbContextOptionsBuilder<TicTacToeDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new TicTacToeDbContext(optionsBuilder.Options);
    }
}
