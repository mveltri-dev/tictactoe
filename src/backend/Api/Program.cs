using Infrastructure.Services;
using Infrastructure.Database;
using Application.Interfaces;
using Api.Hubs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using DotNetEnv;

// Charger les variables d'environnement depuis .env UNIQUEMENT en développement local
// En production Azure, les variables sont chargées automatiquement
var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
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

// 3. Enregistrer les services
builder.Services.AddScoped<GameService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<IGameNotificationService, SignalRNotificationService>();

// 4. Configurer l'authentification JWT
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") 
                ?? Env.GetString("JWT_SECRET") 
                ?? throw new InvalidOperationException("JWT_SECRET n'est pas définie");
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? Env.GetString("JWT_ISSUER") ?? "TicTacToeApi";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? Env.GetString("JWT_AUDIENCE") ?? "TicTacToeClient";

// LOG DEBUG
Console.WriteLine($"@@@@++++++++++DEBUG++++ [Program.cs] JWT_SECRET used for validation: {jwtSecret}");
Console.WriteLine($"@@@@++++++++++DEBUG++++ [Program.cs] JWT_ISSUER: {jwtIssuer}, JWT_AUDIENCE: {jwtAudience}");

builder.Configuration["Jwt:Secret"] = jwtSecret;
builder.Configuration["Jwt:Issuer"] = jwtIssuer;
builder.Configuration["Jwt:Audience"] = jwtAudience;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };
    
    // Configuration pour SignalR : lire le token depuis le query string
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            
            // Si la requête vient du hub SignalR et contient un token
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/gamehub"))
            {
                context.Token = accessToken;
            }
            
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// 5. Configurer CORS pour autoriser le frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var azureUrl = Environment.GetEnvironmentVariable("FRONTEND_AZURE_URL");
        var localUrl = Env.GetString("FRONTEND_LOCAL_URL");
        if (!string.IsNullOrWhiteSpace(azureUrl))
        {
            policy.WithOrigins(azureUrl)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            policy.WithOrigins(localUrl)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

// 6. Ajouter Swagger pour la documentation API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 7. Configurer SignalR
builder.Services.AddSignalR();

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
        var usersCount = await dbContext.Users.CountAsync();
        app.Logger.LogInformation($"Tables vérifiées - Games: {gamesCount}, Users: {usersCount}");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Erreur lors de l'application des migrations");
        throw; // Propager l'erreur pour empêcher le démarrage si la DB ne fonctionne pas
    }
}

// ===== CONFIGURATION DU PIPELINE (après Build) =====

// 1. Activer CORS EN PREMIER (avant tout autre middleware)
app.UseCors("AllowFrontend");

// Middleware de logging pour déboguer (après CORS)
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/gamehub"))
    {
        app.Logger.LogInformation($"++++++++++DEBG++++ SignalR Request: {context.Request.Method} {context.Request.Path} from {context.Request.Headers.Origin}");
    }
    if (!string.IsNullOrEmpty(context.Request.Headers["Origin"]))
    {
        app.Logger.LogInformation($"++++++++++DEBG++++ CORS Origin: {context.Request.Headers["Origin"]}");
    }
    await next();
    if (context.Request.Path.StartsWithSegments("/gamehub"))
    {
        app.Logger.LogInformation($"++++++++++DEBG++++ SignalR Response: {context.Response.StatusCode}");
    }
});

// 2. Activer Swagger 
app.UseSwagger();
app.UseSwaggerUI();

// 3. Activer l'authentification et l'autorisation
app.UseAuthentication();
app.UseAuthorization();

// 4. Mapper les contrôleurs
app.MapControllers();

// 5. Mapper le hub SignalR
app.MapHub<GameHub>("/gamehub");

// 6. Route de test (optionnelle)
app.MapGet("/", () => Results.Ok(new { message = "TicTacToe API is running" }));

app.Run();
