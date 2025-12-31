using Application.Services;
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

// 2. Configurer la base de données PostgreSQL (Supabase)
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("DATABASE_URL n'est pas définie dans le fichier .env");
}

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
        dbContext.Database.Migrate();
        app.Logger.LogInformation("Migrations appliquées avec succès");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Erreur lors de l'application des migrations");
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
