using Application.Services;

var builder = WebApplication.CreateBuilder(args);

// ===== CONFIGURATION DES SERVICES (avant Build) =====

// 1. Ajouter les contrôleurs
builder.Services.AddControllers();

// 2. Enregistrer GameService en SINGLETON (une seule instance pour toute l'app)
builder.Services.AddSingleton<GameService>();

// 3. Configurer CORS pour autoriser le frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Vite dev server
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 4. Ajouter Swagger pour la documentation API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ===== BUILD DE L'APPLICATION =====
var app = builder.Build();

// ===== CONFIGURATION DU PIPELINE (après Build) =====

// 5. Activer Swagger (pour le développement et les démos)
app.UseSwagger();
app.UseSwaggerUI();

// 6. Activer CORS
app.UseCors("AllowFrontend");

// 7. Mapper les contrôleurs
app.MapControllers();

// 8. Route de test (optionnelle)
app.MapGet("/", () => Results.Ok(new { message = "TicTacToe API is running" }));

app.Run();
