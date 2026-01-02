#  Architecture Backend - Documentation Complète

##  Vue d'ensemble

Architecture backend en .NET avec Clean Architecture (Domain, Application, Infrastructure, API).

**Stack technique**:
- .NET 10.0
- Entity Framework Core (PostgreSQL)
- Clean Architecture
- RESTful API

**Projet**: TicTacToe Backend  
**Date de création**: Décembre 2025 - Janvier 2026  

---

##  Architecture en couches

```
src/backend/
├── Domain/          # Entités métier et énumérations
├── Application/     # DTOs, Mappers, logique applicative
├── Infrastructure/  # Database, Services, implémentation technique
└── Api/            # Controllers, endpoints REST
```

### Principe de Clean Architecture

- **Domain**: Cœur métier, aucune dépendance externe
- **Application**: Orchestration, DTOs pour communication
- **Infrastructure**: Implémentation concrète (DB, services externes)
- **Api**: Point d'entrée HTTP, controllers

**Flux de dépendances**: Api → Infrastructure → Application → Domain

---

##  Domain Layer

### Entités

#### **Game.cs**
```csharp
Properties:
- Id (Guid, PK)
- Board (int[9], état du plateau)
- Status (GameStatus enum)
- CreatedAt (DateTime)
- CurrentPlayerSymbol (PlayerSymbol enum)
- Mode (GameMode enum)
- WinningLine (int[]?, positions gagnantes)

Methods:
- UpdateBoard(int[] newBoard)
- UpdateStatus(GameStatus newStatus)
- UpdateCurrentPlayer(PlayerSymbol symbol)
- SetWinningLine(int[] positions)
```

#### **Player.cs**
```csharp
Properties:
- Id (Guid, PK)
- GameId (Guid, FK → Games)
- Symbol (PlayerSymbol enum: X, O)
- Type (PlayerType enum: Human, AI)
- Name (string?)

Navigation:
- Game (Game)
```

#### **User.cs** (depuis authentication-jwt)
```csharp
Properties:
- Id (Guid, PK)
- Username (string, unique)
- Email (string, unique)
- PasswordHash (string, BCrypt)
- CreatedAt (DateTime)
- LastLoginAt (DateTime?)
```

### Énumérations

#### **GameStatus.cs**
```csharp
enum GameStatus {
    InProgress = 0,
    XWins = 1,
    OWins = 2,
    Draw = 3
}
```

#### **GameMode.cs**
```csharp
enum GameMode {
    VsPlayer = 0,        // Local 2 joueurs
    VsAI = 1,           // Contre IA
    VsPlayerOnline = 2  // Multijoueur en ligne
}
```

#### **PlayerSymbol.cs**
```csharp
enum PlayerSymbol {
    X = 0,
    O = 1
}
```

#### **PlayerType.cs**
```csharp
enum PlayerType {
    Human = 0,
    AI = 1
}
```

---

##  Application Layer

### DTOs (Data Transfer Objects)

#### Requests

**CreateGameRequest.cs**
```csharp
- Mode (GameMode)
- Player1Name (string?)
- Player2Name (string?)
```

**PlayMoveRequest.cs**
```csharp
- Position (int, 0-8)
```

**RegisterRequest.cs** (Auth)
```csharp
- Username (string)
- Email (string)
- Password (string)
```

**LoginRequest.cs** (Auth)
```csharp
- EmailOrUsername (string)
- Password (string)
```

#### Responses

**GameDTO.cs**
```csharp
- Id (Guid)
- Board (int[])
- Status (string)
- CreatedAt (DateTime)
- CurrentPlayerSymbol (string)
- Mode (string)
- WinningLine (int[]?)
- Players (List<PlayerDTO>)
```

**PlayerDTO.cs**
```csharp
- Id (Guid)
- Symbol (string)
- Type (string)
- Name (string?)
```

**AuthResponse.cs**
```csharp
- Token (string, JWT)
- ExpiresAt (DateTime)
- User (UserDTO)
```

**UserDTO.cs**
```csharp
- Id (Guid)
- Username (string)
- Email (string)
- CreatedAt (DateTime)
```

### Mappers

#### **GameMapper.cs**
```csharp
static class GameMapper {
    // Entity → DTO
    public static GameDTO ToDTO(Game game)
    
    // DTO → Entity (pour création)
    public static Game ToEntity(CreateGameRequest request)
}
```

**Conversions**:
- Enum → String (pour JSON lisible)
- Relations navigables (Players)
- WinningLine incluse si présente

---

##  Infrastructure Layer

### Database

#### **TicTacToeDbContext.cs**
```csharp
public class TicTacToeDbContext : DbContext {
    public DbSet<Game> Games { get; set; }
    public DbSet<Player> Players { get; set; }
    public DbSet<User> Users { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder) {
        modelBuilder.ApplyConfigurationsFromAssembly(
            Assembly.GetExecutingAssembly()
        );
    }
}
```

#### **TicTacToeDbContextFactory.cs**
Design-time factory pour EF Core migrations.

```csharp
public TicTacToeDbContext CreateDbContext(string[] args) {
    // Charge .env
    // Construit connection string PostgreSQL
    // Retourne DbContext configuré
}
```

#### Configurations

**GameConfiguration.cs**
```csharp
- Table "Games"
- Id: uuid primary key
- Board: jsonb (array JSON)
- Status: int
- Mode: int
- WinningLine: jsonb nullable
- CreatedAt: timestamp with time zone
- Index sur CreatedAt (DESC)
```

**PlayerConfiguration.cs**
```csharp
- Table "Players"
- Id: uuid primary key
- GameId: uuid foreign key → Games
- Symbol: int
- Type: int
- Name: varchar(100) nullable
- Relation: Game (DeleteBehavior.Cascade)
```

**UserConfiguration.cs**
```csharp
- Table "Users"
- Id: uuid primary key
- Username: varchar(50), unique index
- Email: varchar(255), unique index
- PasswordHash: text
- CreatedAt/LastLoginAt: timestamp with time zone
```

### Services

#### **GameService.cs** (Scoped)

**Méthodes principales**:

1. `CreateGameAsync(GameMode mode, string? player1Name, string? player2Name)`
   - Crée Game et Players
   - Sauvegarde en DB
   - Retourne Game complet

2. `GetGameByIdAsync(Guid gameId)`
   - Récupère avec Include(Players)
   - Null si non trouvé

3. `PlayMoveAsync(Guid gameId, int position)`
   - Valide position (0-8, case vide)
   - Met à jour Board
   - Vérifie victoire/match nul
   - Change joueur courant
   - Sauvegarde
   - Retourne Game mis à jour

4. `CheckWinner(int[] board)`
   - 8 lignes gagnantes possibles
   - Retourne (PlayerSymbol?, int[]?) - symbole gagnant et ligne
   - Null si pas de gagnant

5. `IsBoardFull(int[] board)`
   - Vérifie si toutes cases occupées

**Stockage hybride** (depuis online-multiplayer):
- Games locaux (VsPlayer, VsAI): en mémoire (Dictionary)
- Games online (VsPlayerOnline): en base de données
- Méthode `ShouldPersistToDatabase(GameMode)` détermine stockage

#### **AuthService.cs** (Scoped)

Voir [authentication-jwt.md](authentication-jwt.md) pour détails complets.

**Méthodes**:
- `RegisterAsync(RegisterRequest)` → AuthResponse
- `LoginAsync(LoginRequest)` → AuthResponse
- `GenerateJwtToken(User)` → string (privée)

---

##  API Layer

### Controllers

#### **GameController.cs**

**Endpoints**:

1. `POST /api/game` - Créer une partie
   ```csharp
   [HttpPost]
   public async Task<ActionResult<GameDTO>> CreateGame(
       [FromBody] CreateGameRequest request
   )
   ```
   - Body: CreateGameRequest
   - Retourne: 201 Created + GameDTO
   - Location header: /api/game/{id}

2. `GET /api/game/{id}` - Récupérer une partie
   ```csharp
   [HttpGet("{id}")]
   public async Task<ActionResult<GameDTO>> GetGame(Guid id)
   ```
   - Retourne: 200 OK + GameDTO
   - Erreur: 404 Not Found

3. `POST /api/game/{id}/move` - Jouer un coup
   ```csharp
   [HttpPost("{id}/move")]
   public async Task<ActionResult<GameDTO>> PlayMove(
       Guid id,
       [FromBody] PlayMoveRequest request
   )
   ```
   - Body: PlayMoveRequest
   - Retourne: 200 OK + GameDTO
   - Erreurs: 400 Bad Request, 404 Not Found

4. `POST /api/game/{id}/ai-move` - IA joue (asynchrone)
   ```csharp
   [HttpPost("{id}/ai-move")]
   public async Task<ActionResult<GameDTO>> PlayAIMove(Guid id)
   ```
   - Pas de body
   - Retourne: 200 OK + GameDTO après coup IA
   - Erreurs: 400 Bad Request (mauvais mode/état), 404 Not Found

#### **AuthController.cs**

Voir [authentication-jwt.md](authentication-jwt.md) pour détails complets.

**Endpoints**:
- `POST /api/auth/register` → AuthResponse
- `POST /api/auth/login` → AuthResponse

### Program.cs - Configuration

```csharp
// 1. Charger .env
var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
Env.Load(envPath);

// 2. Services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3. Database
var connectionString = BuildConnectionString(); // Azure PostgreSQL
builder.Services.AddDbContext<TicTacToeDbContext>(options =>
    options.UseNpgsql(connectionString)
);

// 4. Services métier
builder.Services.AddScoped<GameService>();
builder.Services.AddScoped<AuthService>();

// 5. JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* config JWT */ });

// 6. CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", policy => {
        policy.WithOrigins("http://localhost:5173", "https://...")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 7. Build & Middleware
var app = builder.Build();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

**Port**: 5000  
**Environment**: Production (par défaut)  
**Swagger**: Activé en développement

---

##  Migrations EF Core

### Migration 1: InitialCreate (20251231001107)

**Créations**:
- Table `Games` (Id, Board, Status, CreatedAt, CurrentPlayerSymbol, Mode)
- Table `Players` (Id, GameId, Symbol, Type, Name)
- Index sur Games.CreatedAt
- Foreign key Players.GameId → Games.Id (CASCADE)

### Migration 2: AddUserEntity (20260102181524)

**Créations**:
- Table `Users` (Id, Username, Email, PasswordHash, CreatedAt, LastLoginAt)
- Unique indexes sur Email et Username

**Modifications**:
- Ajout colonne `WinningLine` (jsonb nullable) dans Games

---

##  Flux de données

### Créer une partie
```
Client → POST /api/game
  ↓
GameController.CreateGame()
  ↓
GameService.CreateGameAsync()
  ↓
- Crée Game entity
- Crée 2 Player entities
- SaveChangesAsync()
  ↓
GameMapper.ToDTO()
  ↓
← 201 Created + GameDTO
```

### Jouer un coup
```
Client → POST /api/game/{id}/move
  ↓
GameController.PlayMove()
  ↓
GameService.PlayMoveAsync()
  ↓
- Valide position
- Met à jour Board
- CheckWinner()
- Change CurrentPlayerSymbol
- SaveChangesAsync()
  ↓
GameMapper.ToDTO()
  ↓
← 200 OK + GameDTO
```

### Authentification
```
Client → POST /api/auth/register
  ↓
AuthController.Register()
  ↓
AuthService.RegisterAsync()
  ↓
- Valide données
- BCrypt.HashPassword()
- Crée User entity
- SaveChangesAsync()
- GenerateJwtToken()
  ↓
← 200 OK + AuthResponse (token + user)
```

---

##  Configuration requise

### Variables d'environnement (.env)

```bash
# Database
DB_HOST=your-database.postgres.database.azure.com
DB_USER=your_admin_username
DB_NAME=postgres
DB_PASSWORD=your_password
DB_PORT=5432

# JWT
JWT_SECRET=<généré avec openssl rand -base64 32>
JWT_ISSUER=TicTacToeApi
JWT_AUDIENCE=TicTacToeClient
```

### Packages NuGet

**Domain**: Aucune dépendance

**Application**: Aucune dépendance

**Infrastructure**:
- Npgsql.EntityFrameworkCore.PostgreSQL 9.0.2
- Microsoft.EntityFrameworkCore.Design 10.0.1
- DotNetEnv 3.1.1
- BCrypt.Net-Next 4.0.3
- System.IdentityModel.Tokens.Jwt 8.15.0
- Microsoft.IdentityModel.Tokens 8.15.0

**Api**:
- Microsoft.AspNetCore.Authentication.JwtBearer 10.0.1
- Microsoft.EntityFrameworkCore.Tools 10.0.1
- Swashbuckle.AspNetCore 7.2.0

---

##  Commandes utiles

### Build & Run
```bash
cd src/backend/Api
dotnet run --project Api.csproj
```

### Migrations
```bash
cd src/backend/Infrastructure

# Créer migration
dotnet ef migrations add MigrationName --startup-project ../Api

# Appliquer migrations
dotnet ef database update --startup-project ../Api

# Rollback migration
dotnet ef database update PreviousMigrationName --startup-project ../Api
```

### Tests
```bash
# Build solution
dotnet build

# Restore packages
dotnet restore
```

---

##  Structure complète

```
src/backend/
├── Api/
│   ├── Api.csproj
│   ├── Program.cs
│   ├── appsettings.json
│   └── Controllers/
│       ├── GameController.cs
│       └── AuthController.cs
│
├── Application/
│   ├── Application.csproj
│   ├── DTOs/
│   │   ├── Requests/
│   │   │   ├── CreateGameRequest.cs
│   │   │   ├── PlayMoveRequest.cs
│   │   │   ├── RegisterRequest.cs
│   │   │   └── LoginRequest.cs
│   │   └── Responses/
│   │       ├── GameDTO.cs
│   │       ├── PlayerDTO.cs
│   │       ├── AuthResponse.cs
│   │       └── UserDTO.cs
│   └── Mappers/
│       └── GameMapper.cs
│
├── Domain/
│   ├── Domain.csproj
│   ├── Entities/
│   │   ├── Game.cs
│   │   ├── Player.cs
│   │   └── User.cs
│   └── Enums/
│       ├── GameMode.cs
│       ├── GameStatus.cs
│       ├── PlayerSymbol.cs
│       └── PlayerType.cs
│
└── Infrastructure/
    ├── Infrastructure.csproj
    ├── Database/
    │   ├── TicTacToeDbContext.cs
    │   ├── TicTacToeDbContextFactory.cs
    │   └── Configurations/
    │       ├── GameConfiguration.cs
    │       ├── PlayerConfiguration.cs
    │       └── UserConfiguration.cs
    ├── Migrations/
    │   ├── 20251231001107_InitialCreate.cs
    │   └── 20260102181524_AddUserEntity.cs
    └── Services/
        ├── GameService.cs
        └── AuthService.cs
```

---

##  Points clés de l'architecture

###  Avantages

1. **Séparation des responsabilités**: Chaque couche a un rôle précis
2. **Testabilité**: Services injectés, logique isolée
3. **Maintenabilité**: Code organisé, facile à modifier
4. **Scalabilité**: Facile d'ajouter features (ex: WebSockets)
5. **Type safety**: Enums, DTOs fortement typés
6. **Clean API**: DTOs évitent d'exposer entités directement

###  Patterns utilisés

- **Repository Pattern**: Via DbContext EF Core
- **DTO Pattern**: Séparation Entity/DTO avec mappers
- **Dependency Injection**: Services injectés via DI container
- **Factory Pattern**: DbContextFactory pour migrations
- **Service Layer**: GameService, AuthService encapsulent logique métier

---

**Dernière mise à jour**: 2 janvier 2026  
**Version**: 1.0 (Production-ready)
