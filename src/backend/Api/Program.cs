using Application.Services;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using DotNetEnv;

// Charger les variables d'environnement depuis .env
Env.Load("../../../.env");

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
