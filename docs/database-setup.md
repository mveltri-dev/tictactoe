#  Configuration Base de Données - Documentation

##  Vue d'ensemble

Configuration PostgreSQL hébergée sur Azure avec Entity Framework Core.

**Base de données**: PostgreSQL 16  
**ORM**: Entity Framework Core 10.0  
**Provider**: Npgsql 9.0.2  
**Hébergement**: Azure Database for PostgreSQL  

---

##  Configuration Azure PostgreSQL

### Informations de connexion

```bash
# Configuration (dans .env)
DB_HOST=tictactoe-db.postgres.database.azure.com
DB_USER=tictactoe_easiadmin
DB_NAME=postgres
DB_PASSWORD=<secret>
DB_PORT=5432
```

### Connection String

**Format Microsoft Azure**:
```
Server={host};
User Id={user};
Database={database};
Port={port};
Password={password};
SSL Mode=Require;
Trust Server Certificate=true
```

**Construit dans Program.cs**:
```csharp
var host = Environment.GetEnvironmentVariable("DB_HOST");
var user = Environment.GetEnvironmentVariable("DB_USER");
var database = Environment.GetEnvironmentVariable("DB_NAME");
var password = Environment.GetEnvironmentVariable("DB_PASSWORD");
var port = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";

var connectionString = $"Server={host};User Id={user};Database={database};Port={port};Password={password};SSL Mode=Require;Trust Server Certificate=true";
```

---

##  Schéma de base de données

### Tables

#### 1. Games
```sql
CREATE TABLE "Games" (
    "Id" uuid PRIMARY KEY,
    "Board" jsonb NOT NULL,
    "Status" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "CurrentPlayerSymbol" integer NOT NULL,
    "Mode" integer NOT NULL,
    "WinningLine" jsonb NULL
);

CREATE INDEX "IX_Games_CreatedAt" ON "Games" ("CreatedAt" DESC);
```

**Colonnes**:
- `Id`: UUID, clé primaire
- `Board`: JSONB array[9] d'entiers (0=vide, 1=X, 2=O)
- `Status`: Integer (0=InProgress, 1=XWins, 2=OWins, 3=Draw)
- `CreatedAt`: Timestamp avec timezone
- `CurrentPlayerSymbol`: Integer (0=X, 1=O)
- `Mode`: Integer (0=VsPlayer, 1=VsAI, 2=VsPlayerOnline)
- `WinningLine`: JSONB array nullable des positions gagnantes [0-8]

**Index**:
- Primary key sur Id
- Index descendant sur CreatedAt (pour queries récentes)

#### 2. Players
```sql
CREATE TABLE "Players" (
    "Id" uuid PRIMARY KEY,
    "GameId" uuid NOT NULL,
    "Symbol" integer NOT NULL,
    "Type" integer NOT NULL,
    "Name" varchar(100) NULL,
    CONSTRAINT "FK_Players_Games_GameId" 
        FOREIGN KEY ("GameId") 
        REFERENCES "Games" ("Id") 
        ON DELETE CASCADE
);

CREATE INDEX "IX_Players_GameId" ON "Players" ("GameId");
```

**Colonnes**:
- `Id`: UUID, clé primaire
- `GameId`: UUID, foreign key → Games
- `Symbol`: Integer (0=X, 1=O)
- `Type`: Integer (0=Human, 1=AI)
- `Name`: VARCHAR(100) nullable

**Relations**:
- Foreign key vers Games avec CASCADE delete
- Index sur GameId pour joins optimisés

#### 3. Users
```sql
CREATE TABLE "Users" (
    "Id" uuid PRIMARY KEY,
    "Username" varchar(50) NOT NULL,
    "Email" varchar(255) NOT NULL,
    "PasswordHash" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "LastLoginAt" timestamp with time zone NULL
);

CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");
CREATE UNIQUE INDEX "IX_Users_Username" ON "Users" ("Username");
```

**Colonnes**:
- `Id`: UUID, clé primaire
- `Username`: VARCHAR(50), unique
- `Email`: VARCHAR(255), unique
- `PasswordHash`: TEXT (BCrypt hash)
- `CreatedAt`: Timestamp avec timezone
- `LastLoginAt`: Timestamp avec timezone, nullable

**Index**:
- Primary key sur Id
- Unique index sur Email (recherche login)
- Unique index sur Username (recherche login)

---

##  Migrations Entity Framework

### Migration 1: InitialCreate (20251231001107)

**Date**: 31 décembre 2025

**Créations**:
1. Table `Games` avec toutes colonnes sauf WinningLine
2. Table `Players` avec relation vers Games
3. Index `IX_Games_CreatedAt`
4. Index `IX_Players_GameId`
5. Foreign key constraint avec CASCADE

**Code génération**:
```bash
dotnet ef migrations add InitialCreate --startup-project ../Api
```

**Code application**:
```bash
dotnet ef database update --startup-project ../Api
```

### Migration 2: AddUserEntity (20260102181524)

**Date**: 2 janvier 2026

**Créations**:
1. Table `Users` complète
2. Unique indexes sur Email et Username

**Modifications**:
1. Ajout colonne `WinningLine` (jsonb nullable) dans table Games

**Code génération**:
```bash
dotnet ef migrations add AddUserEntity --startup-project ../Api
```

**Code application**:
```bash
dotnet ef database update --startup-project ../Api
```

**Fichiers générés**:
- `20260102181524_AddUserEntity.cs` (migration Up/Down)
- `20260102181524_AddUserEntity.Designer.cs` (metadata)
- `TicTacToeDbContextModelSnapshot.cs` (state actuel)

---

##  Types de données PostgreSQL

### Mapping .NET → PostgreSQL

| Type .NET | Type PostgreSQL | Notes |
|-----------|-----------------|-------|
| `Guid` | `uuid` | Clés primaires |
| `int` | `integer` | Enums, nombres |
| `string` | `text` ou `varchar(n)` | Selon max length |
| `DateTime` | `timestamp with time zone` | Timestamps UTC |
| `int[]` | `jsonb` | Board array (via EF Core) |
| `bool` | `boolean` | Valeurs booléennes |

### JSONB pour Board et WinningLine

**Avantages**:
- Storage efficace pour arrays
- Queryable avec opérateurs PostgreSQL
- Indexable si nécessaire
- Flexible pour évolution

**Configuration EF Core**:
```csharp
entity.Property(e => e.Board)
    .HasColumnType("jsonb")
    .IsRequired();

entity.Property(e => e.WinningLine)
    .HasColumnType("jsonb")
    .IsRequired(false);
```

**Format stocké**:
```json
// Board
[0, 1, 2, 0, 1, 0, 2, 0, 0]

// WinningLine
[0, 1, 2]  // Ligne horizontale haut
```

---

##  Entity Framework Configuration

### DbContext

**TicTacToeDbContext.cs**:
```csharp
public class TicTacToeDbContext : DbContext
{
    public DbSet<Game> Games { get; set; }
    public DbSet<Player> Players { get; set; }
    public DbSet<User> Users { get; set; }

    public TicTacToeDbContext(DbContextOptions<TicTacToeDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Auto-découverte des configurations
        modelBuilder.ApplyConfigurationsFromAssembly(
            Assembly.GetExecutingAssembly()
        );
    }
}
```

### Configurations Fluent API

#### GameConfiguration.cs
```csharp
public class GameConfiguration : IEntityTypeConfiguration<Game>
{
    public void Configure(EntityTypeBuilder<Game> builder)
    {
        builder.ToTable("Games");
        
        builder.HasKey(g => g.Id);
        
        builder.Property(g => g.Board)
            .HasColumnType("jsonb")
            .IsRequired();
        
        builder.Property(g => g.Status)
            .IsRequired();
        
        builder.Property(g => g.CreatedAt)
            .IsRequired();
        
        builder.Property(g => g.CurrentPlayerSymbol)
            .IsRequired();
        
        builder.Property(g => g.Mode)
            .IsRequired();
        
        builder.Property(g => g.WinningLine)
            .HasColumnType("jsonb")
            .IsRequired(false);
        
        builder.HasIndex(g => g.CreatedAt)
            .IsDescending();
    }
}
```

#### PlayerConfiguration.cs
```csharp
public class PlayerConfiguration : IEntityTypeConfiguration<Player>
{
    public void Configure(EntityTypeBuilder<Player> builder)
    {
        builder.ToTable("Players");
        
        builder.HasKey(p => p.Id);
        
        builder.Property(p => p.Symbol)
            .IsRequired();
        
        builder.Property(p => p.Type)
            .IsRequired();
        
        builder.Property(p => p.Name)
            .HasMaxLength(100)
            .IsRequired(false);
        
        // Relation Game
        builder.HasOne(p => p.Game)
            .WithMany()
            .HasForeignKey(p => p.GameId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
```

#### UserConfiguration.cs
```csharp
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        
        builder.HasKey(u => u.Id);
        
        builder.Property(u => u.Username)
            .HasMaxLength(50)
            .IsRequired();
        
        builder.Property(u => u.Email)
            .HasMaxLength(255)
            .IsRequired();
        
        builder.Property(u => u.PasswordHash)
            .IsRequired();
        
        builder.Property(u => u.CreatedAt)
            .IsRequired();
        
        builder.Property(u => u.LastLoginAt)
            .IsRequired(false);
        
        // Index uniques
        builder.HasIndex(u => u.Email)
            .IsUnique();
        
        builder.HasIndex(u => u.Username)
            .IsUnique();
    }
}
```

---

## Sécurité

### SSL/TLS

**Configuration**:
```
SSL Mode=Require
Trust Server Certificate=true
```

-  Connexion chiffrée obligatoire
-  Protection contre MITM
-  Trust Server Certificate en développement uniquement
-  En production: Utiliser certificats validés

### Gestion des mots de passe

-  **Jamais** de mots de passe en clair dans le code
-  Variables d'environnement (.env)
-  .env dans .gitignore
-  .env.example pour documentation
-  Azure Key Vault en production (recommandé)

### Accès base de données

**Firewall Azure**:
- Restreindre IPs autorisées
- Activer "Allow Azure services"
- Désactiver accès public si possible (VNet)

---

##  Commandes de maintenance

### Créer une migration
```bash
cd src/backend/Infrastructure
dotnet ef migrations add MigrationName --startup-project ../Api
```

### Appliquer migrations
```bash
dotnet ef database update --startup-project ../Api
```

### Rollback migration
```bash
# Revenir à migration précédente
dotnet ef database update PreviousMigrationName --startup-project ../Api

# Supprimer toutes migrations
dotnet ef database update 0 --startup-project ../Api
```

### Supprimer dernière migration (non appliquée)
```bash
dotnet ef migrations remove --startup-project ../Api
```

### Générer script SQL
```bash
# Tout le schéma
dotnet ef migrations script --startup-project ../Api -o schema.sql

# D'une migration à une autre
dotnet ef migrations script FromMigration ToMigration --startup-project ../Api
```

### Vérifier connexion
```bash
# Dans Program.cs, logs au démarrage
info: Api[0]
      Connexion possible : True
info: Api[0]
      Migrations appliquées : InitialCreate, AddUserEntity
info: Api[0]
      Aucune migration en attente. Base de données à jour.
```

---

##  Queries courantes

### Récupérer parties récentes
```csharp
var recentGames = await _context.Games
    .OrderByDescending(g => g.CreatedAt)
    .Take(10)
    .ToListAsync();
```

### Partie avec joueurs
```csharp
var game = await _context.Games
    .Include(g => g.Players)
    .FirstOrDefaultAsync(g => g.Id == gameId);
```

### Recherche utilisateur
```csharp
// Par email
var user = await _context.Users
    .FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant());

// Par username
var user = await _context.Users
    .FirstOrDefaultAsync(u => u.Username == username);
```

### Statistiques
```sql
-- Nombre de parties par mode
SELECT "Mode", COUNT(*) 
FROM "Games" 
GROUP BY "Mode";

-- Parties terminées aujourd'hui
SELECT COUNT(*) 
FROM "Games" 
WHERE "CreatedAt" >= CURRENT_DATE 
  AND "Status" != 0;

-- Utilisateurs actifs (7 derniers jours)
SELECT COUNT(*) 
FROM "Users" 
WHERE "LastLoginAt" >= NOW() - INTERVAL '7 days';
```

---

##  Troubleshooting

### Erreur: "Build failed" lors de migration

**Cause**: Packages manquants ou erreurs de compilation

**Solution**:
```bash
# Vérifier build
dotnet build

# Installer packages si nécessaire
dotnet restore
```

### Erreur: "DATABASE_URL n'est pas définie"

**Cause**: Fichier .env non chargé ou mal placé

**Solution**:
```csharp
// Vérifier chemin dans Program.cs ou DbContextFactory
var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
if (File.Exists(envPath)) {
    Env.Load(envPath);
}
```

### Erreur: "SSL connection required"

**Cause**: PostgreSQL Azure exige SSL

**Solution**:
```
SSL Mode=Require;Trust Server Certificate=true
```

### Erreur: "Sequence contains no elements"

**Cause**: FirstOrDefaultAsync() renvoie null, puis accès à propriété

**Solution**:
```csharp
var game = await _context.Games.FindAsync(gameId);
if (game == null) {
    return NotFound();
}
```

---

##  Performances

### Indexes créés

1. **Games.CreatedAt** (DESC)
   - Pour queries récentes optimisées
   - `ORDER BY CreatedAt DESC LIMIT 10`

2. **Players.GameId**
   - Pour joins Games ↔ Players
   - Créé automatiquement par EF Core

3. **Users.Email** (UNIQUE)
   - Pour login par email
   - Recherche O(log n)

4. **Users.Username** (UNIQUE)
   - Pour login par username
   - Recherche O(log n)

### Optimisations futures possibles

- Index sur Games.Status pour filtrer parties actives
- Partitioning par date si volume élevé
- Connection pooling (déjà activé par Npgsql)
- Read replicas pour scalabilité lecture

---

##  Fichiers de configuration

```
src/backend/
├── .env                          # Variables d'environnement (non tracké)
├── .env.example                  # Template de configuration
│
└── Infrastructure/
    ├── Database/
    │   ├── TicTacToeDbContext.cs           # Context principal
    │   ├── TicTacToeDbContextFactory.cs    # Factory design-time
    │   └── Configurations/
    │       ├── GameConfiguration.cs
    │       ├── PlayerConfiguration.cs
    │       └── UserConfiguration.cs
    │
    └── Migrations/
        ├── 20251231001107_InitialCreate.cs
        ├── 20251231001107_InitialCreate.Designer.cs
        ├── 20260102181524_AddUserEntity.cs
        ├── 20260102181524_AddUserEntity.Designer.cs
        └── TicTacToeDbContextModelSnapshot.cs
```

---

##  Checklist mise en production

### Avant déploiement

- [ ] Vérifier toutes migrations appliquées
- [ ] Backup base de données
- [ ] Tester rollback migrations
- [ ] Connection string en Azure Key Vault
- [ ] SSL avec certificats validés
- [ ] Firewall restrictif (IPs spécifiques)
- [ ] Connection pooling configuré
- [ ] Logging queries lentes activé
- [ ] Monitoring Azure activé

### Après déploiement

- [ ] Vérifier connexion API ↔ DB
- [ ] Tester endpoints critiques
- [ ] Monitoring performances
- [ ] Backup automatique configuré
- [ ] Alertes sur erreurs DB

---

**Dernière mise à jour**: 2 janvier 2026  
**Version PostgreSQL**: 16  
**Version EF Core**: 10.0.1
