using Infrastructure.Services;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using DotNetEnv;

// Charger les variables d'environnement depuis .env UNIQUEMENT en développement local
// En production Azure, les variables sont chargées automatiquement
var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", ".env");
if (File.Exists(envPath))
{
    Env.Load(envPath);
}

var builder = WebApplication.CreateBuilder(args);

// ===== CONFIGURATION DES SERVICES (avant Build) =====

// 1. Ajouter les contrôleurs
builder.Services.AddControllers();

// 2. Configurer la base de données PostgreSQL Azure
// Construction de la chaîne de connexion selon le format Microsoft Azure
var host = Environment.GetEnvironmentVariable("DB_HOST")
                ?? Env.GetString("DB_HOST");
var user = Environment.GetEnvironmentVariable("DB_USER") ?? Env.GetString("DB_USER");
var database = Environment.GetEnvironmentVariable("DB_NAME") ?? Env.GetString("DB_NAME");
var password = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? Env.GetString("DB_PASSWORD");
var port = Environment.GetEnvironmentVariable("DB_PORT") ?? Env.GetString("DB_PORT") ?? "5432";

if (string.IsNullOrEmpty(password))
{
    throw new InvalidOperationException("DB_PASSWORD n'est pas définie");
}

var connectionString = string.Format(
    "Server={0}; User Id={1}; Database={2}; Port={3}; Password={4}; SSL Mode=Require",
    host,
    user,
    database,
    port,
    password);

builder.Services.AddDbContext<TicTacToeDbContext>(options =>
    options.UseNpgsql(connectionString));

// 3. Enregistrer GameService en SCOPED (une instance par requête HTTP)
builder.Services.AddScoped<GameService>();

// 4. Configurer CORS pour autoriser le frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Vite dev server
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 5. Ajouter Swagger pour la documentation API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ===== BUILD DE L'APPLICATION =====
var app = builder.Build();

// ===== APPLIQUER LES MIGRATIONS AUTOMATIQUEMENT =====
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<TicTacToeDbContext>();
    try
    {
        app.Logger.LogInformation("Vérification de la connexion à la base de données...");
        var canConnect = await dbContext.Database.CanConnectAsync();
        app.Logger.LogInformation($"Connexion possible : {canConnect}");
        
        app.Logger.LogInformation("Récupération des migrations en attente...");
        var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
        var appliedMigrations = await dbContext.Database.GetAppliedMigrationsAsync();
        
        app.Logger.LogInformation($"Migrations appliquées : {string.Join(", ", appliedMigrations)}");
        app.Logger.LogInformation($"Migrations en attente : {string.Join(", ", pendingMigrations)}");
        
        if (pendingMigrations.Any())
        {
            app.Logger.LogInformation("Application des migrations...");
            await dbContext.Database.MigrateAsync();
            app.Logger.LogInformation("Migrations appliquées avec succès");
        }
        else
        {
            app.Logger.LogInformation("Aucune migration en attente. Base de données à jour.");
        }
        
        // Vérifier que les tables existent
        app.Logger.LogInformation("Vérification des tables...");
        var gamesCount = await dbContext.Games.CountAsync();
        var playersCount = await dbContext.Players.CountAsync();
        app.Logger.LogInformation($"Tables vérifiées - Games: {gamesCount}, Players: {playersCount}");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Erreur lors de l'application des migrations");
        throw; // Propager l'erreur pour empêcher le démarrage si la DB ne fonctionne pas
    }
}

// ===== CONFIGURATION DU PIPELINE (après Build) =====

// 5. Activer Swagger 
app.UseSwagger();
app.UseSwaggerUI();

// 6. Activer CORS
app.UseCors("AllowFrontend");

// 7. Mapper les contrôleurs
app.MapControllers();

// 8. Route de test (optionnelle)
app.MapGet("/", () => Results.Ok(new { message = "TicTacToe API is running" }));

app.Run();
