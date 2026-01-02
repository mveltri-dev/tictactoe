# TIC-TAC-TOE

Status: Planning

## **Phase 1 : Configuration Git et GitHub**

### Objectif

Initialiser le projet avec Git et configurer l'authentification SSH pour GitHub.

### Étapes réalisées

### 1. Création du repository GitHub

- Nom : `tictactoe`
- Visibilité : Public
- Initialisation : Avec README initial

### 2. Configuration SSH

```markdown
# Génération de la clé SSH (si pas déjà fait)
ssh-keygen -t ed25519 -C "ton-email@example.com"

# Ajout de la clé SSH à l'agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copie de la clé publique pour GitHub
cat ~/.ssh/id_ed25519.pub
```

- Ajout de la clé publique dans GitHub : Settings → SSH and GPG keys
- Test de connexion : `ssh -T git@github.com`

### 3. Clone du repository

```markdown
git clone git@github.com:mveltri-dev/tictactoe.git
cd tictactoe
```

### Concepts clés à expliquer en entretien

- **SSH** : Protocole sécurisé pour l'authentification sans mot de passe
- **Clé publique/privée** : La publique est sur GitHub, la privée reste sur ta machine
- **Pourquoi SSH ?** : Plus sécurisé et pratique que HTTPS (pas de mot de passe à chaque push)

---

## **Phase 2 : Architecture et Structure du Projet**

### Objectif

Créer une structure de projet professionnelle avec Clean Architecture (backend) et Atomic Design (frontend).

### Stratégie de branches (Git Flow)

```markdown
main (production)
  └── develop (intégration)
        └── feature/initial-setup (développement)
```

**Commandes utilisées :**

```markdown
# Création de la branche develop depuis main
git checkout -b develop

# Création de la branche feature
git checkout -b feature/initial-setup

# Après développement, merge dans develop
git checkout develop
git merge feature/initial-setup

# Suppression de la branche feature
git branch -d feature/initial-setup
git push origin --delete feature/initial-setup
```

### Structure Backend - Clean Architecture

**Principe** : Séparation des responsabilités en couches indépendantes.

```markdown
backend/
├── Domain/                    # Couche métier (cœur)
│   ├── Entities/             # Objets métier (Game, Player)
│   └── Enums/                # Énumérations (GameStatus, PlayerSymbol)
│
├── Application/              # Logique applicative
│   ├── DTOs/                # Data Transfer Objects
│   └── Services/            # Services métier (GameService)
│
├── Infrastructure/          # Accès aux données
│   └── Database/           # Configuration BDD
│
└── Api/                    # Couche présentation
    ├── Controllers/        # Endpoints REST
    └── Program.cs         # Point d'entrée
```

**Dépendances** : Domain ← Application ← Infrastructure ← Api

**Avantages** :

- Code testable et maintenable
- Changement de BDD facile (Infrastructure isolée)
- Logique métier indépendante du framework

### Structure Frontend - Atomic Design

**Principe** : Organisation des composants du plus simple au plus complexe.

```markdown
frontend/
└── src/
    ├── components/
    │   ├── atoms/           # Éléments de base (Button, Input)
    │   ├── molecules/       # Combinaisons simples (Cell)
    │   ├── organisms/       # Composants complexes (Board)
    │   └── templates/       # Mises en page
    │
    ├── pages/              # Pages complètes (App.tsx)
    ├── hooks/              # Hooks personnalisés (useGame)
    ├── services/           # Appels API (api.ts)
    ├── types/              # Types TypeScript (dto.ts)
    └── styles/             # Styles CSS
```

**Avantages** :

- Réutilisabilité maximale
- Code modulaire et testable
- Facilite le travail en équipe

### Technologies utilisées

**Backend**

- .NET 10 - Framework C#
- ASP.NET Core - API REST
- Entity Framework Core - ORM (optionnel)

**Frontend**

- React 18 - Bibliothèque UI
- TypeScript 5 - Typage statique
- Vite 5 - Build tool rapide

### Fichiers de configuration créés

- .gitignore - Ignore bin/, obj/, node_modules/, dist/
- .gitattributes - Normalisation des fins de ligne
- tictactoe.sln - Solution .NET
- README.md - Documentation du projet

---

## **Phase 3 : Développement Backend - Logique du Jeu**

### Branche : `feature/backend-game-logic`

```markdown
git checkout develop
git checkout -b feature/backend-game-logic
```

### Étape 3.1 : Création des Enums

**Objectif** : Définir les valeurs possibles pour les symboles et l'état du jeu.

### Qu'est-ce qu'un Enum ?

Un **enum** (énumération) est un type qui définit un ensemble de constantes nommées.

**Avantages** :

- Pas d'erreur de frappe (typo)
- Auto-complétion dans l'IDE
- Code plus lisible et maintenable
- Sécurité du typage

**Exemple sans enum** :

```markdown
string symbol = "X"; // Risque : "x", "0", etc.
```

**Exemple avec enum** :

```markdown
PlayerSymbol symbol = PlayerSymbol.X; // Sûr et clair
```

### 1. PlayerSymbol.cs

**Emplacement** : PlayerSymbol.cs

**Valeurs automatiques** :

- X = 0 (assigné automatiquement par C#)
- O = 1

### 2. GameStatus.cs

**Emplacement** : GameStatus.cs

**Les 4 états possibles d'un Tic-Tac-Toe** :

1. `InProgress` - En cours de jeu
2. `XWins` - X a aligné 3 symboles
3. `OWins` - O a aligné 3 symboles
4. `Draw` - Plateau plein, pas de gagnant

### Commentaires XML

**Format utilisé** : `/// <summary>...</summary>`

**Avantages** :

- Standard C# professionnel
- Apparaît dans IntelliSense (auto-complétion)
- Génère une documentation automatique
- Facilite la compréhension du code

## Étape 3.2 : Enums Supplémentaires pour l'Extensibilité

**Contexte** : Le projet doit initialement permettre de jouer contre l'ordinateur, mais doit être évolutif pour supporter le multijoueur local et en ligne.

### 1. PlayerType.cs

**Emplacement** : Domain/Enums/PlayerType.cs

**Objectif** : Distinguer un joueur humain d'un ordinateur pour déclencher l'IA.

**Valeurs** :

- **Human** - Joueur humain (attend une action utilisateur)
- **Computer** - Ordinateur (déclenche l'IA automatiquement)

**Utilité** :

- Permet au GameService de savoir quand appeler l'IA
- Évite de vérifier si le nom est "EasiBot"
- Code plus propre et maintenable

### 2. GameMode.cs

**Emplacement** : Domain/Enums/GameMode.cs

**Objectif** : Supporter plusieurs modes de jeu sans refactoring futur.

**Valeurs** :

- **VsComputer** - Joueur contre ordinateur (implémentation actuelle)
- **VsPlayerLocal** - Deux joueurs sur la même machine (prévu)
- **VsPlayerOnline** - Deux joueurs en réseau (prévu)

**Pourquoi maintenant ?**

- Ajouter un mode après coup nécessiterait de modifier Game, Player, GameService
- Anticiper = architecture propre dès le départ
- Suit le principe Open/Closed (ouvert à l'extension, fermé à la modification)

---

## Étape 3.3 : Refactoring des Entités avec Constructeurs

**Problème identifié** : Les object initializers ne garantissent pas la validité des objets.

### Avant (Object Initializers)

```csharp
Player player = new Player
{
    Name = "Alice",  // Oubli possible de définir Symbol ou Type
    Symbol = PlayerSymbol.X
    // Type non défini = bug potentiel
};

```

**Risques** :

- Propriétés oubliées
- État invalide
- Bugs difficiles à déboguer

### Après (Constructeurs)

**Principe** : Le constructeur force à fournir toutes les valeurs obligatoires.

### Player.cs

**Emplacement** : Domain/Entities/Player.cs

**Signature du constructeur** :

```csharp
public Player(string name, PlayerSymbol symbol, PlayerType type)

```

**Responsabilités** :

1. Génère automatiquement un Guid unique
2. Valide que le nom n'est pas null
3. Initialise toutes les propriétés obligatoires
4. Utilise **private set** pour l'immutabilité

**Private setters** : Empêche la modification après création (protection de l'intégrité).

### Game.cs

**Emplacement** : Domain/Entities/Game.cs

**Signature du constructeur** :

```csharp
public Game(Guid playerXId, Guid playerOId, GameMode mode)

```

**Responsabilités** :

1. Génère un Guid unique pour la partie
2. Initialise le plateau vide (9 cases à null)
3. **Règle métier** : X commence toujours (règle classique du Tic-Tac-Toe)
4. Définit le statut initial à InProgress
5. Enregistre la date de création
6. Stocke le mode de jeu

**Décision architecturale** : X commence toujours, peu importe qui choisit quel symbole.

---

## Étape 3.4 : Séparation DTOs en Requests et Responses

**Principe CQRS** : Command Query Responsibility Segregation - Séparer les entrées des sorties.

### Nouvelle organisation

```
Application/
├── DTOs/
│   ├── Requests/          ← Ce qu'on REÇOIT du client
│   │   ├── CreateGameRequest.cs
│   │   └── MakeMoveRequest.cs
│   └── Responses/         ← Ce qu'on RETOURNE au client
│       ├── GameDTO.cs
│       └── PlayerDTO.cs

```

**Avantages** :

- Séparation claire entre entrées et sorties
- Facilite l'ajout de validations dans Requests
- Permet des transformations spécifiques dans Responses
- Plus facile de trouver ce qu'on cherche

### Sécurité : Validations Data Annotations

**Objectif** : Protéger contre les injections et les données invalides.

### CreateGameRequest.cs

**Emplacement** : CreateGameRequest.cs

**Validations appliquées** :

**Player1Name** :

- `[Required]` - Obligatoire
- `[StringLength(50, MinimumLength = 1)]` - Entre 1 et 50 caractères
- `[RegularExpression]` - Uniquement lettres, chiffres, espaces, tirets et accents français
- Protection contre injection XSS, SQL, scripts

**ChosenSymbol** :

- `[Required]` - Obligatoire
- `[RegularExpression(@"^(X|O)$")]` - Strictement "X" ou "O"

**GameMode** :

- `[Required]` - Obligatoire
- `[RegularExpression(@"^(VsComputer|VsPlayerLocal|VsPlayerOnline)$")]` - Valeurs exactes

**Player2Name** (optionnel) :

- Mêmes validations que Player1Name si fourni

### MakeMoveRequest.cs

**Emplacement** : MakeMoveRequest.cs

**Validations appliquées** :

**GameId et PlayerId** :

- `[Required]` - Guid obligatoires

**Position** :

- `[Required]` - Obligatoire
- `[Range(0, 8)]` - Valeur strictement entre 0 et 8 inclus

**Pourquoi Data Annotations ?**

- Validation automatique par [ASP.NET](http://asp.net/) Core via ModelState
- Pas besoin de code manuel dans le contrôleur
- Messages d'erreur personnalisables
- Standard de l'industrie

### Responses (GameDTO et PlayerDTO)

**Emplacement** : Application/DTOs/Responses/

**Particularité** : Conversion des enums en strings pour JSON.

**Exemple** :

```csharp
Status = game.Status.ToString() // "InProgress" au lieu de 0

```

**Raison** : JSON n'a pas de notion d'enum, les strings sont plus lisibles pour le frontend.

---

## Étape 3.5 : GameMapper - Centralisation des Conversions

**Problème identifié** : La méthode `MapToDTO` dans GameService viole le principe de responsabilité unique.

### Solution : Mapper dédié

**Emplacement** : GameMapper.cs

**Classe statique** : Pas besoin d'instanciation, méthodes utilitaires pures.

### Méthodes

**ToDTO(Game game)** :

- Convertit une entité Game en GameDTO
- Transforme Board (PlayerSymbol?[]) en string?[] pour JSON
- Convertit tous les enums en strings

**ToDTO(Player player)** :

- Convertit une entité Player en PlayerDTO
- Simplifie pour l'API

### Avantages

- **Réutilisable** : Utilisable dans tous les services
- **Testable** : Facile à tester unitairement (pas de dépendances)
- **Responsabilité unique** : GameService gère la logique, GameMapper gère les conversions
- **Clean Architecture** : Séparation claire des responsabilités
- **Évolutif** : Ajout facile de FromDTO si besoin

### Utilisation dans GameService

Avant :

```csharp
return MapToDTO(game);

```

Après :

```csharp
return GameMapper.ToDTO(game);

```

---

## Étape 3.6 : GameService avec Gestion d'Erreurs Complète

**Principe** : Toujours anticiper les erreurs et fournir des messages explicites.

### 3 niveaux de sécurité

**Niveau 1 : Validations Data Annotations** (dans les Requests)

- Bloque les requêtes invalides avant même d'arriver au service

**Niveau 2 : Try-Catch dans le Service**

- Capture les erreurs inattendues
- Retransmet avec contexte explicite

**Niveau 3 : Sanitization des inputs**

- `.Trim()` sur tous les strings utilisateur
- `TryParse` au lieu de `Parse` pour les enums
- Validation null explicite

### CreateGame() - Structure Try-Catch

**Emplacement** : GameService.cs

### Bloc Try

**1. Validation null explicite** :

```csharp
if (request == null)
    throw new ArgumentNullException(nameof(request), "La requête ne peut pas être null.");

```

**2. TryParse pour les enums** :

```csharp
if (!Enum.TryParse<GameMode>(request.GameMode, out GameMode gameMode))
    throw new ArgumentException($"Mode de jeu invalide : {request.GameMode}");

```

**Pourquoi TryParse ?**

- `Parse` lance une exception si la valeur est invalide
- `TryParse` retourne false, on contrôle le message d'erreur

**3. Sanitization des inputs** :

```csharp
Player player1 = new Player(request.Player1Name.Trim(), ...);

```

**4. Logique métier** (création players, game, sauvegarde)

### Blocs Catch

**ArgumentNullException** :

- Capture les paramètres requis manquants
- Retransmet avec contexte

**ArgumentException** :

- Capture les erreurs de validation
- Préfixe "Erreur de validation :"

**Exception générique** :

- Filet de sécurité pour erreurs inattendues
- Encapsule dans InvalidOperationException avec contexte

### Avantages de cette approche

- **Debugging facilité** : Messages d'erreur explicites
- **Sécurité** : Aucune erreur non gérée
- **Maintenabilité** : Code structuré et prévisible
- **Expérience utilisateur** : Messages d'erreur compréhensibles
- **Production-ready** : Prêt pour un environnement réel

---

## Étape 3.7 : Méthodes Complémentaires du GameService

### GetGame(Guid gameId)

**Emplacement** : GameService.cs

**Objectif** : Récupérer une partie existante par son identifiant.

**Implémentation** :

```csharp
public GameDTO GetGame(Guid gameId)
{
    try
    {
        if (!_games.TryGetValue(gameId, out Game? game))
        {
            throw new KeyNotFoundException($"Partie introuvable avec l'ID : {gameId}");
        }
        return GameMapper.ToDTO(game);
    }
    catch (KeyNotFoundException) { throw; }
    catch (Exception ex)
    {
        throw new InvalidOperationException($"Erreur lors de la récupération : {ex.Message}", ex);
    }
}

```

**Points clés** :

- Utilise `TryGetValue` pour éviter les exceptions inutiles
- Lance `KeyNotFoundException` si la partie n'existe pas
- Convertit l'entité en DTO via le mapper

---

### MakeMove(MakeMoveRequest request)

**Emplacement** : GameService.cs

**Objectif** : Jouer un coup dans une partie existante avec validation complète.

**11 étapes de validation** :

1. **Validation requête non-null** : Vérifie que la requête existe
2. **Vérification partie existe** : Récupère la partie depuis le dictionnaire
3. **Vérification joueur existe** : Récupère le joueur depuis le dictionnaire
4. **Partie non terminée** : Status doit être InProgress
5. **Bon tour du joueur** : player.Symbol doit égaler game.CurrentTurn
6. **Position valide** : Entre 0 et (width * height - 1)
7. **Case libre** : game.Board[position] doit être null
8. **Placement du symbole** : Affecte player.Symbol à la case
9. **Vérification victoire** : Appelle CheckWinner()
10. **Vérification match nul** : Appelle IsBoardFull()
11. **IA automatique** : Si tour de l'ordinateur, appelle PlayComputerMove()

**Gestion des tours** :

- Si victoire : game.Status = XWins ou OWins, game.WinnerId = [player.Id](http://player.id/)
- Si match nul : game.Status = Draw
- Sinon : Change CurrentTurn (X → O ou O → X)

**Particularité** : Après un coup humain, si c'est le tour de l'ordinateur (PlayerType.Computer), l'IA joue automatiquement → Le frontend reçoit le plateau déjà mis à jour !

---

### CheckWinner(Game game, PlayerSymbol symbol)

**Emplacement** : GameService.cs (méthode privée)

**Objectif** : Vérifier si un joueur a gagné en alignant les symboles requis.

**Génération dynamique des combinaisons** :

Appelle `GenerateWinningCombinations(game.Width, game.Height)` qui calcule :

- **Lignes** : Toutes les séquences horizontales de longueur requise
- **Colonnes** : Toutes les séquences verticales de longueur requise
- **Diagonales \** : Toutes les diagonales descendantes
- **Diagonales /** : Toutes les diagonales ascendantes

**Règle de victoire** : Aligner `Math.Min(width, height)` symboles identiques.

**Exemples** :

- 3×3 → Aligner 3 symboles (8 combinaisons au total)
- 3×4 → Aligner 3 symboles (plus de combinaisons car plusieurs positions possibles)
- 4×4 → Aligner 4 symboles (10 combinaisons)
- 5×3 → Aligner 3 symboles (le minimum entre 5 et 3)

**Vérification** :
Itère sur chaque combinaison et vérifie si tous les index contiennent le symbole recherché.

---

### IsBoardFull(Game game)

**Emplacement** : GameService.cs (méthode privée)

**Objectif** : Détecter un match nul en vérifiant si toutes les cases sont occupées.

**Implémentation** :

```csharp
return game.Board.All(cell => cell != null);

```

**LINQ expliqué** :

- `All()` : Vérifie que TOUTES les cases respectent la condition
- `cell != null` : Chaque case doit contenir un symbole (X ou O)
- Retourne `true` si aucune case vide, `false` sinon

---

### PlayComputerMove(Game game, Player computerPlayer)

**Emplacement** : GameService.cs (méthode privée)

**Objectif** : Faire jouer l'ordinateur automatiquement avec un algorithme aléatoire.

**7 étapes de l'IA** :

1. **Trouver positions libres** : Parcourt le board et collecte les index où `game.Board[i] == null`
2. **Vérification sécurité** : Si aucune position libre, ne rien faire (ne devrait jamais arriver)
3. **Choix aléatoire** : Utilise `Random.Next(emptyPositions.Count)` pour sélectionner un index
4. **Placement** : Affecte `computerPlayer.Symbol` à la position choisie
5. **Vérification victoire** : Appelle `CheckWinner()` pour voir si l'IA a gagné
6. **Vérification match nul** : Appelle `IsBoardFull()`
7. **Changement de tour** : Si la partie continue, passe au tour suivant

**Type d'IA** : **Random AI** (aléatoire)

- Très simple à implémenter
- Pas de stratégie
- Suffisant pour le MVP
- Peut être amélioré plus tard (Minimax, etc.)

---

## Étape 3.8 : Support des Plateaux Rectangulaires

**Problème identifié** : Les combinaisons gagnantes étaient hardcodées pour 3×3. Impossible d'évoluer vers 4×4 ou rectangles.

### Solution : Génération Dynamique

**Modifications dans Game.cs** :

- Remplacement de `Size` par `Width` et `Height`
- Constructeur accepte `width` et `height` (défaut 3×3)
- Board devient `new PlayerSymbol?[width * height]`
- Validation : width ≥ 3 ET height ≥ 3

**Modifications dans GameService.cs** :

- Méthode `GenerateWinningCombinations(int width, int height)`
- Calcul dynamique de `winLength = Math.Min(width, height)`
- Génération de toutes les combinaisons possibles (pas juste les bords)

### Algorithme de génération

**Lignes** : Pour chaque ligne, créer toutes les séquences possibles de `winLength` symboles

```
Ligne 0 d'un 3×4 : [0,1,2] et [1,2,3]

```

**Colonnes** : Pour chaque colonne, créer toutes les séquences verticales

```
Colonne 0 d'un 4×3 : [0,4,8]

```

**Diagonales \** : Toutes les diagonales descendantes possibles

```
3×3 : [0,4,8]
3×4 : [0,4,8], [1,5,9], etc.

```

**Diagonales /** : Toutes les diagonales ascendantes possibles

```
3×3 : [2,4,6]
3×4 : [2,4,6], [3,5,7], etc.

```

### Avantages

 **Évolutif** : Fonctionne pour n'importe quelle taille ≥ 3×3

 **Rectangles supportés** : 3×4, 4×5, etc.

 **Pas de refactoring** : Changement du board = 0 modif du code

 **Interview-ready** : Montre la capacité à anticiper les évolutions

---

## Étape 3.9 : Configuration de l'API REST

### Program.cs - Configuration [ASP.NET](http://asp.net/) Core

**Emplacement** : Program.cs

**Singleton pour GameService** :

```csharp
builder.Services.AddSingleton<GameService>();

```

**Pourquoi Singleton ?**

- Une seule instance pour toute l'application
- Les dictionnaires `_games` et `_players` persistent entre les requêtes
- Sans ça : chaque requête = nouvelle instance = données perdues !

**CORS** : Autorise le frontend React à appeler l'API

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("<http://localhost:5173>")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

```

**Swagger** : Documentation API interactive

- Accessible sur `/swagger/index.html`
- Teste les endpoints directement dans le navigateur
- Génère automatiquement la doc à partir des attributs

---

### GameController - Endpoints REST

**Emplacement** : Api/Controllers/GameController.cs

**3 endpoints HTTP** :

**POST /api/game** - Créer une partie

- Reçoit `CreateGameRequest` dans le body
- Validation automatique via `ModelState.IsValid`
- Retourne `200 OK + GameDTO` ou `400 Bad Request`

**GET /api/game/{id}** - Récupérer une partie

- Reçoit Guid dans l'URL
- Retourne `200 OK + GameDTO` ou `404 Not Found`

**POST /api/game/{id}/moves** - Jouer un coup

- Reçoit `MakeMoveRequest` dans le body
- Vérifie que l'ID URL = ID requête
- Retourne `200 OK + GameDTO mis à jour`
- L'IA joue automatiquement si nécessaire

**Gestion d'erreurs** :

- `KeyNotFoundException` → 404 Not Found
- `ArgumentException` → 400 Bad Request
- `InvalidOperationException` → 400 Bad Request
- `Exception` générique → 500 Internal Server Error

**Attributs utilisés** :

- `[ApiController]` : Active la validation automatique
- `[Route("api/[controller]")]` : Définit l'URL de base
- `[HttpPost]`, `[HttpGet]` : Verbes HTTP
- `[ProducesResponseType]` : Documentation Swagger
- `[FromBody]` : Indique que les données viennent du body JSON

---

## Étape 4 : Persistance des Données avec Entity Framework Core et Azure

### 4.1 : Pourquoi la Persistance ?

**Problème avec l'approche in-memory** :

- GameService utilisait `Dictionary<Guid, Game>` et `Dictionary<Guid, Player>`
-  Simple et rapide pour commencer
-  Données perdues à chaque redémarrage de l'application
-  Impossible de scaler horizontalement (plusieurs instances)
-  Pas de données en production réelle

**Solution : Base de données relationnelle**

- Données persistées sur disque
- Survit aux redémarrages
- Permet les backups automatiques
- Prêt pour la production

---

### 4.2 : Choix Technologiques

**Entity Framework Core 10.0**

- ORM (Object-Relational Mapping) officiel Microsoft
- Traduit automatiquement C# ↔ SQL
- Gère les migrations de schéma
- Type-safe et intégré à .NET

**Azure Database for PostgreSQL**

- Base de données relationnelle open-source
- Flexible Server : arrêt/démarrage pour économiser
- Intégration native avec Azure Web App
- SSL/TLS obligatoire (sécurité)

**Packages installés** :

- `Npgsql.EntityFrameworkCore.PostgreSQL` : Provider PostgreSQL pour EF Core
- `Microsoft.EntityFrameworkCore.Design` : Outils de migration
- `DotNetEnv` : Gestion des variables d'environnement

---

### 4.3 : Architecture Entity Framework

**DbContext** : `TicTacToeDbContext`

- Point d'entrée unique pour accéder à la base
- Contient les `DbSet<Game>` et `DbSet<Player>`
- Configure les entités via `EntityTypeConfiguration`
- Enregistré comme service **Scoped** (une instance par requête HTTP)

**Entity Configurations** :

- `GameConfiguration` : Mapping de l'entité Game
- `PlayerConfiguration` : Mapping de l'entité Player
- Sépare la logique de mapping du DbContext (Clean Architecture)
- Convertit les enums en strings, les tableaux en JSON

**Migrations** :

- `InitialCreate` : Crée les tables Games et Players
- Historique dans `__EFMigrationsHistory`
- Appliquées automatiquement au démarrage via `Database.MigrateAsync()`

---

### 4.4 : Configuration Azure PostgreSQL

**Ressources créées** :

- **Resource Group** : `tictactoe-rg` (contient toutes les ressources)
- **PostgreSQL Flexible Server** : `tictactoe-db.postgres.database.azure.com`
    - Tier : B1ms (1 vCore, 2GB RAM, ~17€/mois)
    - Région : North Europe
    - PostgreSQL version 17
- **Database** : `postgres` (base par défaut)

**Sécurité réseau** :

- Firewall configuré pour autoriser :
    - Azure services (communication Web App → Database)
    - IP développeur (accès depuis VS Code)
- SSL/TLS requis pour toutes les connexions

**Gestion des coûts** :

- **Start/Stop** : Arrêt manuel pour économiser (~1€/mois au lieu de 17€)
- **Budget Alert** : Email à 25% du budget (1.25€)
- Crédit Azure gratuit : ~96€ disponibles

---

### 4.5 : Variables d'Environnement

**Pourquoi ?**

-  Ne JAMAIS commiter les mots de passe dans Git
-  Séparer config développement / production
-  Sécurité renforcée

**Format de connection string PostgreSQL** :

```
Server=host;Database=db;Port=5432;User Id=user;Password=pass;Ssl Mode=Require;

```

** Pièges rencontrés** :

- Azure génère format SQL Server (incompatible avec Npgsql)
- Espaces obligatoires : `Ssl Mode` (pas `SSL Mode` ni `SslMode`)
- `User Id` (pas `Username`)

**Configuration locale (.env)** :

- Variables séparées : `DB_HOST`, `DB_USER`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`
- Fichier .env en .gitignore
- Chargé uniquement si le fichier existe (évite erreur en production)

**Configuration Azure** :

- Variables définies dans Application Settings du Web App
- Automatiquement injectées comme variables d'environnement
- Pas de fichier .env déployé

---

### 4.6 : Migration du GameService

**Transformation majeure** :

**Avant (in-memory)** :

```csharp
private readonly Dictionary<Guid, Game> _games = new();
private readonly Dictionary<Guid, Player> _players = new();

```

**Après (Entity Framework)** :

```csharp
private readonly TicTacToeDbContext _dbContext;

public GameService(TicTacToeDbContext dbContext)
{
    _dbContext = dbContext;
}

```

**Changements clés** :

**1. Toutes les méthodes deviennent async** :

- `CreateGame()` → `async Task<GameDTO>`
- `GetGame()` → `async Task<GameDTO>`
- `MakeMove()` → `async Task<GameDTO>`
- Les opérations base de données sont asynchrones (I/O)

**2. Remplacements d'opérations** :

- `_games[id] = game` → `await _dbContext.Games.AddAsync(game); await _dbContext.SaveChangesAsync()`
- `_games.TryGetValue(id, out game)` → `await _dbContext.Games.FindAsync(id)`
- Modifications : `_dbContext.Games.Update(game); await _dbContext.SaveChangesAsync()`

**3. Controller mis à jour** :

- Signatures async : `async Task<IActionResult>`
- Appels avec `await` : `await _gameService.CreateGame(request)`

---

### 4.7 : Problème de Dépendance Circulaire

**Erreur rencontrée** :

```
error MSB4006: Il existe une dépendance circulaire

```

**Cause** :

- GameService était dans `Application` (utilisait TicTacToeDbContext)
- TicTacToeDbContext était dans `Infrastructure` (référençait Application pour les DTOs)
- Application → Infrastructure → Application = ⭕ cycle !

**Solution appliquée** :

- **GameService déplacé** : `Application/Services` → `Infrastructure/Services`
- Namespace changé : `Application.Services` → `Infrastructure.Services`
- Controller et Program.cs mis à jour

**Architecture finale Clean** :

```
Domain (Entities, Enums)
    ↑
Application (DTOs, Mappers)
    ↑
Infrastructure (DbContext, GameService)
    ↑
Api (Controllers, Program.cs)

```

---

### 4.8 : Déploiement et Validation

**GitHub Actions CI/CD** :

- Push sur `feature/database-integration` → build automatique
- Déploiement vers Azure Web App
- Migrations appliquées au démarrage de l'application

**Logs de démarrage (diagnostics)** :

```
Vérification de la connexion à la base de données...
Connexion possible : True
Migrations appliquées : 20251231001107_InitialCreate
Migrations en attente : (empty)
Tables vérifiées - Games: 0, Players: 0

```

**Tests effectués** :

1.  POST `/api/game` → Partie créée
2.  Vérification PostgreSQL → Données présentes (1 Game, 2 Players)
3.  GET `/api/game/{id}` → Partie récupérée depuis la BD
4.  Persistance confirmée : données survivent aux redémarrages

---

### 4.9 : Outils de Développement

**VS Code PostgreSQL Extension** :

- Connexion directe à Azure PostgreSQL
- Exécution de requêtes SQL
- Visualisation des tables et données en temps réel

**Azure Portal** :

- Gestion des ressources (start/stop)
- Query Editor intégré
- Monitoring et métriques
- Cost Management

**Azure CLI** :

- Création/configuration des ressources
- Consultation des logs en temps réel
- Redémarrage applications

---

###  Leçons Apprises

** Bonnes pratiques** :

- Toujours utiliser variables d'environnement pour les secrets
- Auto-migrations au démarrage = déploiement simplifié
- Logs détaillés pendant la phase de setup
- Stop/start de la BD pour économiser en développement

** Pièges évités** :

- Format de connection string : respecter exactement la syntaxe Npgsql
- Dépendances circulaires : respecter l'architecture en couches
- Scoped vs Singleton : DbContext doit être Scoped (une instance/requête)
- Async/await : obligatoire partout avec Entity Framework

** Gestion des coûts** :

- Utiliser le tier le moins cher en développement (B1ms)
- Arrêter les ressources inutilisées
- Configurer des alertes budgétaires proactives
- Profiter des crédits étudiants Azure

---

# Frontend - React + TypeScript Documentation

## Étape 5 : Architecture Frontend

### 5.1 : Stack Technique

**Technologies principales** :

- **React 18.3.1** : Bibliothèque UI avec hooks modernes
- **TypeScript 5.9.3** : Typage statique pour éviter les erreurs
- **Vite 5.4.21** : Build tool ultra-rapide (HMR en <100ms)
- **React Router 7.11.0** : Routing côté client
- **Framer Motion 12.23.26** : Animations fluides
- **Lucide React 0.562** : Icônes SVG optimisées
- **clsx 2.1.1** : Utilitaire pour classes CSS conditionnelles

**Pourquoi ces choix ?**

 **Vite vs Create React App** : Build 10x plus rapide, ESM natif
 **TypeScript** : Détection d'erreurs à la compilation, autocomplétion
 **Framer Motion** : Animations déclaratives, spring physics naturelles
 **CSS Modules** : Isolation des styles, pas de conflits de noms

---

### 5.2 : Architecture Atomic Design

**Principe** : Organisation des composants en 5 niveaux hiérarchiques

```
atoms/          → Composants de base non décomposables
molecules/      → Combinaison d'atoms simples
organisms/      → Sections complexes avec logique métier
templates/      → Layout et structure de page
pages/          → Pages complètes avec données

```

**Avantages** :

 **Réutilisabilité maximale** : Atoms utilisés partout
 **Maintenabilité** : Changement atom = propagation automatique
 **Testabilité** : Chaque niveau testable isolément
 **Scalabilité** : Ajout de features sans refactoring

---

### 5.3 : Composants Atoms (7 composants)

**Philosophie** : Composants unitaires, pas de dépendances entre eux

**1. Button** - Bouton générique réutilisable

- Variants : primary, secondary, destructive
- States : default, hover, disabled
- Framer Motion : scale + opacity sur hover

**2. IconX** - Symbole X animé

- SVG path avec strokeDashoffset animation
- Transition fluide 0.3s

**3. IconO** - Symbole O animé

- Cercle SVG avec scale spring animation
- Framer Motion variants

**4. ScoreBadge** - Badge de score

- Variants : x (violet), o (rose), draw (neutre)
- Label + valeur numérique
- CSS Modules avec variables HSL

**5. CellMark** - Marque dans une cellule

- Affiche X ou O selon le symbole
- Animation d'apparition scale + rotate
- Exit animation pour restart

**6. GameButton** - Bouton de jeu

- Icône + texte
- Hover effect avec glow
- Variantes : restart, new game

**7. ThemeToggle** - Switch light/dark mode

- Sun/Moon icons (Lucide)
- Animation de rotation 180°
- Persist dans localStorage

---

### 5.4 : Composants Molecules (8 composants)

**Philosophie** : Combinaison d'atoms avec logique simple

**1. GameCell** - Cellule du plateau

- Composition : Button + CellMark
- Props : position, value, onClick, disabled, isWinning
- Animation glow vert sur winning line
- Hover effect seulement si cliquable

**2. PlayerCard** - Carte joueur

- Affiche nom + symbole
- Highlight si c'est son tour
- Pulse animation quand actif
- Composition : IconX/IconO + texte

**3. GameStatus** - Statut de la partie

- Affiche : "Tour de X", "X gagne !", "Match nul"
- Animation slide in from top
- Couleur adaptée au contexte

**4. PlayerNamesInput** - Formulaire de saisie

- 2 inputs avec validation
- Label + icône User (Lucide)
- maxLength: 20 caractères
- showPlayer2 conditionnel (mode IA)

**5. GameControls** - Boutons de contrôle

- "Nouvelle partie" + "Recommencer"
- Composition : 2 GameButton
- Layout flex avec gap

**6. ScorePanel** - Panneau des scores

- 3 ScoreBadge : X, Nuls, O
- Layout horizontal avec gap
- Animation fade in

**7. StatusDisplay** - Affichage riche du statut

- Inclut GameStatus
- Icônes contextuelles (Trophy, Brain, Loader)
- Messages adaptés : "IA réfléchit...", "Vous avez gagné !"

**8. LoginForm** - Modal de connexion

- Formulaire email + password (futur)
- Overlay blur avec AnimatePresence
- Fermeture par backdrop click ou X

---

### 5.5 : Composants Organisms (6 composants)

**Philosophie** : Sections complètes avec logique métier

**1. GameBoard** - Plateau de jeu 3×3

- Grid CSS 3 colonnes
- Map des 9 cellules
- Gère les clicks et l'état disabled
- Animation stagger sur les cellules

**2. GameConfiguration** - Page de configuration

- Choix du symbole (X ou O)
- Saisie des noms (conditionnel selon mode)
- Bouton "Commencer"
- Validation : nom requis si visible

**3. GamePlaying** - Page de jeu en cours

- Composition :
    - ScorePanel (top)
    - PlayerCard × 2 (gauche/droite)
    - GameBoard (centre)
    - StatusDisplay (sous le board)
    - GameControls (bottom)
- Gestion état loading (spinner)
- Attribution correcte des scores selon chosenSymbol

**4. GameModeSelector** - Sélecteur de mode

- 3 modes : vs IA, vs Local, vs En ligne
- Icônes : Bot, Users, Globe
- Badge "Pro" sur mode online
- onClick : LoginForm si pas connecté

**5. GameHeader** - En-tête de l'app

- Logo + titre
- ThemeToggle
- Layout flex space-between

**6. SettingsMenu** - Menu de paramètres

- Toggle son
- Sélecteur de langue
- Layout vertical avec sections

---

### 5.6 : Template GameLayout

**Rôle** : Structure globale de toutes les pages

**Structure** :

```
<header> GameHeader
<main>
  <children> Contenu dynamique (router)
<aside> SettingsMenu

```

**Caractéristiques** :

- Layout responsive
- Props : isSoundEnabled, language, onSoundToggle, onLanguageChange
- Thème appliqué via ThemeProvider
- Padding et max-width pour lisibilité

---

### 5.7 : CSS Modules - Remplacement de Tailwind

**Décision technique** : Supprimer Tailwind CSS

**Pourquoi ?**

-  Tailwind = 54 packages supplémentaires
-  Build time plus long
-  Classes utilitaires illisibles (className="flex flex-col items-center...")
-  Pas de vraie isolation des styles

**Solution adoptée : CSS Modules**

-  Fichier .module.css par composant
-  Isolation automatique (hash des noms)
-  CSS pur, performances optimales
-  Pas de dépendances externes
-  Bundle -25 KB JS, -6 KB CSS

**Système de variables CSS** :

```css
:root {
  --background: 240 5% 99%;
  --primary: 240 60% 50%;
  --game-x: 280 70% 60%;
  --game-o: 340 65% 58%;
}

```

**Thème dark** :

```css
.dark {
  --background: 270 50% 11%;
  --primary: 280 75% 62%;
}

```

**Format HSL** : Permet l'alpha channel `hsl(var(--primary) / 0.5)`

**Inspiration design** : Couleurs [easi.net](http://easi.net/) (bleus, violets)

---

### 5.8 : State Management avec useGame

**Philosophie** : Pas de Redux, custom hook suffit

**État géré** :

- `game: GameDTO | null` - Partie en cours
- `config: GameConfig` - Configuration (noms, symbole, mode)
- `appState: AppState` - État UI (configuration, loading, playing, finished, error)
- `scores: Scores` - Scores cumulés (X, O, draws)
- `error: string | null` - Message d'erreur

**Actions** :

- `createGame()` - Créer nouvelle partie (async)
- `makeMove()` - Jouer un coup avec délai IA (async)
- `resetGame()` - Retour à la configuration
- `updateConfig()` - Modifier config (noms, symbole)
- `changeGameMode()` - Changer de mode

**Auto-restart** :

- useEffect détecte fin de partie
- Attend 2 secondes
- Crée automatiquement nouvelle partie avec même config
- Permet les parties rapides successives

**Gestion scores** :

- Incrémentation par symbole (X, O, draws)
- previousGameStatusRef évite double comptage
- Reset lors de resetGame()

**Gestion IA** :

- Délai 1200ms avant coup IA (UX)
- Appel api.playAiMove() séparé
- Console.log pour debug timing

---

### 5.9 : Routing avec React Router

**Structure des routes** :

```
/                 → Configuration (GameConfiguration)
/game/:id         → Jeu en cours (GamePlaying)

```

**Navigation** :

- `useNavigate()` pour redirection programmatique
- Après création partie : navigate(`/game/${newGame.id}`)
- Bouton "Nouvelle partie" : navigate('/')

**Gestion erreurs** :

- Partie introuvable (404) : Message + bouton retour
- État error : Affichage message + actions

**BrowserRouter** :

- Configuré dans main.tsx
- Enveloppe toute l'application
- Permet liens navigables

---

### 5.10 : Intégration API

**Service API** : api.ts

**Configuration URL** :

```tsx
const BASE_URL = import.meta.env.VITE_API_LOCAL_URL ||
                 import.meta.env.VITE_API_AZURE_URL

```

**Priorité** : LOCAL → AZURE (facilite développement)

**Méthodes** :

- `createGame(request)` - POST /api/game
- `getGame(id)` - GET /api/game/{id}
- `makeMove(request)` - POST /api/game/{id}/moves
- `playAiMove(gameId)` - POST /api/game/{id}/ai-move

**Gestion erreurs** :

- Fetch avec try/catch
- Parse erreur JSON si disponible
- Console.log pour debugging
- Throw Error avec message explicite

**Headers** :

- Content-Type: application/json
- Pas d'auth pour l'instant (v1)

---

### 5.11 : Theme System

**ThemeProvider** : Context React pour le thème

**Features** :

- Toggle light/dark mode
- Persist dans localStorage
- data-theme attribute sur <html>
- .dark class pour compatibilité

**Hook useTheme()** :

```tsx
const { theme, toggleTheme, setTheme } = useTheme()

```

**Application** :

- Variables CSS adaptées au thème
- Smooth transition 0.3s
- Pas de flash lors du chargement

---

### 5.12 : TypeScript - DTOs et Types

**Enums** :

- Symbol : "X" | "O"
- GameModeAPI : "VsComputer" | "VsPlayerLocal" | "VsPlayerOnline"
- GameMode : "ai" | "local" | "friend" (UI)
- GameStatus : "InProgress" | "XWins" | "OWins" | "Draw"
- AppState : "configuration" | "loading" | "playing" | "finished" | "error"

**Request DTOs** :

- CreateGameRequest : player1Name, player2Name?, chosenSymbol, gameMode
- MakeMoveRequest : gameId, playerId, position

**Response DTOs** :

- GameDTO : id, board, playerXId, playerOId, currentTurn, status, winnerId, winningLine, createdAt, mode
- PlayerDTO : id, name, symbol

**Bénéfices TypeScript** :

- Autocomplétion dans VSCode
- Erreurs à la compilation (pas au runtime)
- Refactoring sûr
- Documentation inline

---

### 5.13 : Build et Configuration

**Vite Config** :

```tsx
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: { port: 5173 }
})

```

**TypeScript Config** :

- target: ES2022 (features modernes)
- moduleResolution: bundler (Vite-friendly)
- paths: { "@/*": ["./src/*"] } (imports propres)
- strict: true (typage strict)

**PostCSS** :

- autoprefixer (compatibilité navigateurs)
- Pas de Tailwind

**Package.json** :

- type: "module" (ESM natif)
- 15 dependencies (vs 69 avec Tailwind)

**Bundle sizes** :

- JS : 334.28 KB
- CSS : 21.13 KB
- Total : ~355 KB (gzipped ~100 KB)

---

### 5.14 : Problèmes Résolus

**1. Page blanche après Tailwind removal**

- Cause : App.tsx utilisait classes Tailwind
- Solution : Créer App.module.css, convertir toutes les classes
- Leçon : Convertir TOUS les composants, pas seulement Atomic Design

**2. Scores comptés en double**

- Cause : useEffect déclenché 2× (player move + AI move)
- Solution : previousGameStatusRef pour tracker changements
- Incrémente seulement si statut passe de "InProgress" à terminé

**3. Scores attribués au mauvais joueur**

- Cause : scores.X hardcodé pour joueur 1
- Solution : Mapper selon config.chosenSymbol
- Si user joue O : user = scores.O, EasiBot = scores.X

**4. Erreur API 404 sur coup IA**

- Cause : [game.id](http://game.id/) stale après makeMove
- Solution : Utiliser [updatedGame.id](http://updatedgame.id/) (frais)
- Importance : Closures JavaScript

**5. Erreur TypeScript "Cannot find module 'path'"**

- Cause : __dirname non disponible en ESM
- Solution : fileURLToPath(new URL()) + @types/node

**6. setTimeout type mismatch**

- Cause : Node.js vs Browser Timeout types
- Solution : ReturnType<typeof setTimeout>

---

### 5.15 : Animations Framer Motion

**Patterns utilisés** :

**1. Fade + Slide**

```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4 }}

```

**2. Scale Spring**

```tsx
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
transition={{ type: "spring", stiffness: 400 }}

```

**3. Stagger Children**

```tsx
variants={containerVariants}
<motion.div variants={itemVariants}>

```

**4. Exit Animations**

```tsx
<AnimatePresence>
  {condition && <Component exit={{ opacity: 0 }} />}
</AnimatePresence>

```

**Principe** : Animations déclaratives, pas d'état manuel

---

### 5.16 : Conventions de Code

**Naming** :

- Composants : PascalCase (GameBoard.tsx)
- Hooks : camelCase avec préfixe use (useGame.ts)
- CSS Modules : kebab-case (.button-primary)
- Types : PascalCase (GameDTO, Symbol)

**Structure fichiers** :

```
ComponentName/
  ComponentName.tsx
  ComponentName.module.css
  index.ts (export)

```

**Imports** :

- React types : `import type React from "react"`
- Types locaux : `import type { GameDTO } from "../dtos"`
- Composants : `import { Button } from "@/components/atoms"`

**Exports** :

- index.ts dans chaque dossier
- Export groupé : `export { Button } from "./Button/Button"`
- Import depuis niveau supérieur : `import { Button, IconX } from "@/components/atoms"`

---

### 5.17 : Prochaines Étapes

**Fonctionnalités à implémenter** :

 **Multijoueur en ligne** (branche feature/online-multiplayer)

- WebSockets pour temps réel
- Système de rooms/lobby
- Matching de joueurs
- Chat en jeu

 **Authentification**

- Système de comptes utilisateurs
- Historique des parties
- Classement ELO
- Statistiques personnelles

 **Progressive Web App**

- Service Worker
- Cache offline
- Installable sur mobile
- Notifications push

 **Internationalisation**

- Support multi-langues
- Français, Anglais, Espagnol
- Format dates/heures localisé

 **Tests**

- Unit tests (Vitest)
- Component tests (Testing Library)
- E2E tests (Playwright)
- Coverage >80%

---

## Phase 6 : Préparation du Multijoueur en Ligne

### Branche : `feature/online-multiplayer`

Cette phase prépare le terrain pour le mode multijoueur en ligne en ajoutant les fondations nécessaires sans déployer la fonctionnalité complète. L'objectif est de rendre le code évolutif et de supporter plusieurs modes de stockage selon le type de partie.

### 6.1 : Tracking de la ligne gagnante

Dans sa version initiale, le jeu détectait bien les victoires mais ne conservait pas l'information sur quelle combinaison avait gagné. Cette donnée est essentielle pour animer visuellement la victoire dans le frontend.

**Modification de l'entité Game**

La propriété `WinningLine` a été ajoutée pour stocker les positions gagnantes sous forme de tableau d'entiers. Par exemple, une victoire horizontale sur la première ligne sera représentée par `[0, 1, 2]`. Cette information est optionnelle car elle n'existe que lorsqu'une partie est terminée avec un gagnant.

La méthode `SetWinningLine` valide que le tableau contient exactement trois positions avant de l'assigner. Cette validation empêche les états incohérents et garantit l'intégrité des données.

**Mise à jour de CheckWinner**

La logique de détection de victoire a été modifiée pour retourner non seulement le symbole gagnant mais aussi les positions de la ligne gagnante. Au lieu de simplement vérifier les combinaisons, la méthode conserve maintenant le pattern qui a matché.

Les huit combinaisons gagnantes possibles sont toujours générées dynamiquement, mais désormais chaque pattern est retourné lorsqu'une correspondance est trouvée. Cette approche reste compatible avec les plateaux rectangulaires implémentés précédemment.

**Propagation dans les DTOs**

Le `GameDTO` expose maintenant la propriété `WinningLine` pour que le frontend puisse l'utiliser. Lors de la conversion via `GameMapper`, cette information est transmise telle quelle sans transformation particulière. Le frontend reçoit donc un tableau d'index qu'il peut utiliser pour appliquer des styles spéciaux aux cellules gagnantes.

### 6.2 : Endpoint pour les coups de l'IA

L'implémentation initiale du mode contre l'ordinateur présentait un problème d'expérience utilisateur. Après qu'un joueur humain jouait, le frontend devait faire un deuxième appel API pour déclencher le coup de l'IA. Cette approche créait de la latence et compliquait la logique côté client.

**Solution : Endpoint dédié pour l'IA**

Un nouvel endpoint `POST /api/game/{id}/ai-move` a été créé spécifiquement pour gérer le tour complet de l'ordinateur. Lorsque cet endpoint est appelé, le backend vérifie d'abord les conditions nécessaires.

La partie doit être en mode `VsAI`, ce qui garantit qu'on ne tente pas de jouer un coup IA dans une partie multijoueur. Le statut doit être `InProgress`, car on ne peut pas jouer dans une partie terminée. Enfin, c'est bien le tour du joueur ordinateur selon `CurrentTurn`.

**Implémentation de PlayAIMoveAsync**

Cette nouvelle méthode du `GameService` encapsule toute la logique de jeu de l'IA. Elle identifie d'abord les positions libres sur le plateau en parcourant le tableau `Board`. Un générateur aléatoire sélectionne ensuite une de ces positions.

Une fois la position choisie, la méthode réutilise `PlayMoveAsync` existante pour effectuer le coup. Cette réutilisation est importante car elle garantit que toutes les validations et la logique de détection de victoire sont appliquées de manière cohérente.

L'algorithme de l'IA reste volontairement simple pour cette version. Il s'agit d'un choix aléatoire parmi les cases disponibles. Cette approche suffit pour le MVP et peut être améliorée ultérieurement avec des algorithmes plus sophistiqués comme Minimax sans toucher à l'architecture.

**Avantages pour le frontend**

Avec ce nouvel endpoint, le frontend peut maintenant effectuer un seul appel après le coup du joueur. Le backend retourne le plateau déjà mis à jour avec le coup de l'IA joué. Cette approche simplifie considérablement la logique côté client et améliore la réactivité perçue.

### 6.3 : Stockage hybride selon le mode de jeu

L'utilisation d'Entity Framework pour toutes les parties, même celles en mode local, créait une charge inutile sur la base de données. Les parties contre l'ordinateur ou en local sur la même machine n'ont pas besoin de persistance au-delà de la session.

**Stratégie de stockage différenciée**

La solution adoptée consiste à maintenir deux systèmes de stockage en parallèle. Un dictionnaire statique `Dictionary<Guid, Game>` stocke les parties locales directement en mémoire. La base de données PostgreSQL via Entity Framework continue de gérer les parties en ligne qui nécessitent une vraie persistance.

La méthode `ShouldPersistToDatabase` détermine le système de stockage approprié en fonction du `GameMode`. Les modes `VsPlayer` et `VsAI` utilisent la mémoire tandis que `VsPlayerOnline` utilise la base de données.

**Adaptations du GameService**

Toutes les méthodes du service ont été modifiées pour consulter d'abord le stockage mémoire avant d'interroger la base de données. Par exemple, `GetGameByIdAsync` vérifie `_inMemoryGames.TryGetValue` avant d'appeler `_context.Games.FindAsync`.

La création de parties avec `CreateGameAsync` ajoute au dictionnaire ou à la base selon le mode. Les sauvegardes avec `SaveChangesAsync` ne sont appelées que pour les parties persistées. Cette logique conditionnelle garantit des performances optimales pour chaque type de partie.

**Implications et limitations**

Cette approche améliore significativement les performances pour les parties locales qui représentent probablement la majorité des cas d'usage. Cependant, les données en mémoire sont volatiles et disparaissent au redémarrage de l'application.

Pour une application de production à grande échelle, cette solution pourrait être remplacée par un cache distribué comme Redis. Mais pour le contexte actuel, le compromis entre simplicité d'implémentation et performance est largement favorable.

Le dictionnaire statique fonctionne correctement dans le cadre d'une seule instance d'application. Si l'application devait scaler horizontalement avec plusieurs instances, il faudrait centraliser ce cache. Cette considération reste hors scope pour le MVP actuel.

### 6.4 : Migration de base de données

L'ajout de la propriété `WinningLine` à l'entité `Game` nécessitait une nouvelle migration Entity Framework. Plutôt que de créer une migration séparée uniquement pour ce changement, celle-ci a été intégrée à la migration `AddUserEntity` qui sera expliquée dans la phase suivante.

La colonne `WinningLine` est de type `jsonb` dans PostgreSQL, ce qui permet de stocker un tableau d'entiers de manière native. Ce type est particulièrement adapté car il permet des requêtes efficaces si nécessaire tout en restant flexible.

La colonne est définie comme nullable puisqu'elle ne contient une valeur que pour les parties terminées avec un gagnant. Les matchs nuls et les parties en cours n'ont pas de ligne gagnante, donc la valeur reste à null.

---

## Phase 7 : Authentification JWT

### Branche : `feature/authentication-jwt`

Le système d'authentification est une brique fondamentale pour toutes les fonctionnalités multijoueur. Cette phase implémente un système complet basé sur JWT avec gestion sécurisée des mots de passe via BCrypt.

### 7.1 : Architecture du système d'authentification

L'authentification suit les principes de sécurité modernes en séparant clairement les responsabilités entre stockage utilisateur, validation des credentials et génération de tokens.

**Entité User**

Une nouvelle entité `User` a été créée dans la couche Domain pour représenter un utilisateur du système. Cette entité contient les informations de base nécessaires à l'authentification et à l'identification.

L'identifiant est un Guid généré automatiquement. Le username et l'email servent tous deux à l'identification lors de la connexion, offrant ainsi de la flexibilité aux utilisateurs. Le mot de passe n'est jamais stocké en clair mais toujours sous forme de hash BCrypt dans `PasswordHash`.

Deux timestamps complètent l'entité. Le `CreatedAt` enregistre la date d'inscription tandis que `LastLoginAt` permet de tracker l'activité. Cette dernière propriété est mise à jour à chaque connexion réussie.

La méthode `UpdateLastLogin` encapsule cette mise à jour en respectant le principe d'encapsulation. Les setters privés empêchent toute modification directe des propriétés depuis l'extérieur de l'entité, préservant ainsi l'intégrité des données.

**DTOs pour l'authentification**

Quatre DTOs ont été créés pour gérer les flux d'inscription et de connexion. `RegisterRequest` contient les informations nécessaires à la création d'un compte : username, email et password. Des validations par Data Annotations garantissent que les données respectent les contraintes minimales.

Le `LoginRequest` est plus flexible en acceptant un champ `EmailOrUsername` qui peut contenir l'un ou l'autre. Cette approche simplifie l'expérience utilisateur qui n'a pas à se souvenir s'il s'est inscrit avec son email ou son username.

La réponse d'authentification est encapsulée dans `AuthResponse` qui contient le token JWT généré, sa date d'expiration et un `UserDTO`. Ce dernier expose les informations publiques de l'utilisateur sans jamais inclure le hash du mot de passe.

### 7.2 : Service d'authentification et hashing BCrypt

Le `AuthService` implémente toute la logique métier liée à l'authentification. Ce service est enregistré comme Scoped dans le conteneur d'injection de dépendances car il dépend du `DbContext` qui lui-même doit être Scoped.

**Inscription utilisateur**

La méthode `RegisterAsync` gère le processus complet de création de compte. Elle commence par valider que les données fournies sont cohérentes et que les champs obligatoires sont remplis.

Une vérification d'unicité est ensuite effectuée sur l'email et le username. Si l'un ou l'autre existe déjà, une exception est levée avec un message explicite. Cette vérification préalable évite les erreurs de contrainte unique au niveau base de données.

Le mot de passe en clair est immédiatement hashé via `BCrypt.HashPassword`. BCrypt est un algorithme de hashing spécifiquement conçu pour les mots de passe avec un coût computationnel ajustable. Contrairement à SHA256, il inclut automatiquement un salt aléatoire et est résistant aux attaques par rainbow tables.

Une fois l'utilisateur créé et sauvegardé, un token JWT est généré via `GenerateJwtToken`. Ce token est retourné au client qui pourra l'utiliser pour les requêtes authentifiées.

**Connexion utilisateur**

La méthode `LoginAsync` gère l'authentification d'un utilisateur existant. Elle commence par rechercher l'utilisateur par email ou username grâce à une requête flexible. L'email est normalisé en minuscules pour garantir que la recherche est case-insensitive.

Si aucun utilisateur n'est trouvé, une `UnauthorizedAccessException` est levée. Le message d'erreur reste volontairement générique pour ne pas révéler si c'est l'identifiant ou le mot de passe qui est incorrect.

La vérification du mot de passe utilise `BCrypt.Verify` qui compare le mot de passe fourni avec le hash stocké. Cette méthode gère automatiquement l'extraction du salt et la recomputation du hash pour validation.

Si les credentials sont valides, le `LastLoginAt` de l'utilisateur est mis à jour avant de sauvegarder en base. Un nouveau token JWT est ensuite généré et retourné avec les informations utilisateur.

**Génération des tokens JWT**

La méthode privée `GenerateJwtToken` construit un token JWT valide selon les standards. Elle crée des claims pour identifier l'utilisateur de manière unique.

Le claim `Sub` contient l'identifiant utilisateur, `Email` l'email, et `UniqueName` le username. Un `Jti` unique est généré pour chaque token, permettant potentiellement de révoquer des tokens spécifiques.

La date d'expiration est fixée à 7 jours après la génération. Ce délai représente un bon compromis entre sécurité et expérience utilisateur pour une application web.

Le token est signé avec une clé secrète via l'algorithme HS256. Cette clé est récupérée depuis les variables d'environnement et ne doit jamais être exposée publiquement.

### 7.3 : Configuration JWT dans l'API

L'API doit être configurée pour valider automatiquement les tokens JWT sur les endpoints protégés. Cette configuration se fait dans `Program.cs` via le middleware d'authentification ASP.NET Core.

**Ajout du middleware JWT**

Le service d'authentification est enregistré avec le schéma `JwtBearer`. Les paramètres de validation sont cruciaux pour la sécurité du système.

`ValidateIssuer` et `ValidateAudience` sont activés pour vérifier que le token provient bien de notre API. Ces valeurs sont également récupérées depuis les variables d'environnement.

`ValidateLifetime` garantit que les tokens expirés sont rejetés automatiquement. `ValidateIssuerSigningKey` vérifie la signature du token avec la clé secrète, empêchant ainsi toute falsification.

La clé de signature est construite depuis la variable `JWT_SECRET` encodée en UTF-8. Cette clé doit contenir au minimum 32 caractères pour assurer un niveau de sécurité suffisant.

**Middleware dans le pipeline**

Les appels à `UseAuthentication` et `UseAuthorization` sont ajoutés dans le pipeline de requêtes HTTP. Leur ordre est important : l'authentification doit intervenir avant l'autorisation.

Ces middlewares sont placés avant `UseSwagger` mais après `UseCors`. Cet ordonnancement garantit que les en-têtes CORS sont traités correctement tout en protégeant les endpoints sensibles.

**AuthController**

Un nouveau contrôleur `AuthController` expose deux endpoints publics pour l'inscription et la connexion. Ces endpoints ne nécessitent pas d'authentification puisqu'ils servent justement à obtenir un token.

L'endpoint `POST /api/auth/register` accepte un `RegisterRequest` et retourne un `AuthResponse` en cas de succès. Les validations automatiques d'ASP.NET Core rejettent les requêtes invalides avant même d'atteindre le service.

L'endpoint `POST /api/auth/login` fonctionne de manière similaire mais avec un `LoginRequest`. En cas d'erreur d'authentification, un code 401 Unauthorized est retourné.

La gestion d'erreurs suit le même pattern que dans `GameController`. Les `ArgumentException` donnent des 400, les `UnauthorizedAccessException` des 401, et les autres erreurs des 500.

### 7.4 : Configuration de la base de données

L'ajout de l'entité User nécessitait une configuration Entity Framework et une migration.

**UserConfiguration**

La classe `UserConfiguration` définit le mapping entre l'entité et la table PostgreSQL. Les propriétés `Username` et `Email` ont des longueurs maximales définies pour optimiser les index.

Deux index uniques sont créés sur ces colonnes pour garantir l'unicité au niveau base de données. Ces index accélèrent également les requêtes de recherche lors de la connexion.

Le `DbSet<User>` a été ajouté au `TicTacToeDbContext` pour permettre les opérations CRUD. La configuration est automatiquement découverte grâce à `ApplyConfigurationsFromAssembly`.

**Migration AddUserEntity**

Une nouvelle migration `AddUserEntity` a été générée et appliquée. Cette migration crée la table `Users` avec toutes ses colonnes et index.

La même migration inclut également l'ajout de la colonne `WinningLine` à la table `Games`, regroupant ainsi deux changements logiquement liés au développement des features online.

### 7.5 : Packages NuGet installés

Deux packages principaux ont été ajoutés pour supporter l'authentification JWT.

`BCrypt.Net-Next` version 4.0.3 fournit les fonctions de hashing BCrypt. Ce package est installé dans le projet Infrastructure car c'est là que se trouve le `AuthService`.

`Microsoft.AspNetCore.Authentication.JwtBearer` version 10.0.1 est ajouté au projet Api. Ce package apporte le middleware de validation JWT et toutes ses dépendances, notamment les bibliothèques `Microsoft.IdentityModel.*`.

Le projet Infrastructure nécessite également `System.IdentityModel.Tokens.Jwt` et `Microsoft.IdentityModel.Tokens` pour générer les tokens. Ces dépendances ont été ajoutées explicitement après avoir rencontré une erreur de build.

---

## Phase 8 : Configuration et Sécurité

### 8.1 : Gestion des variables d'environnement

La sécurité d'une application passe par une gestion rigoureuse des secrets et des configurations. Les mots de passe, clés API et autres credentials ne doivent jamais être commités dans le code source.

**Fichiers .env**

Deux fichiers .env ont été créés, un pour le backend et un pour le frontend. Ces fichiers contiennent les variables d'environnement nécessaires à l'exécution locale de l'application.

Le backend nécessite les informations de connexion PostgreSQL : hôte, utilisateur, nom de base, mot de passe et port. Ces informations sont fournies séparément plutôt que dans une seule connection string pour plus de flexibilité.

Les variables JWT sont également définies : le secret utilisé pour signer les tokens, l'issuer qui identifie l'API, et l'audience qui identifie les clients autorisés. Le secret doit être généré aléatoirement avec une longueur suffisante.

Le frontend définit deux URLs : une pour l'API locale en développement et une pour l'API Azure en production. Le code Vite utilise la variable locale en priorité lorsqu'elle est définie.

**Fichiers .env.example**

Des fichiers exemples ont été créés pour documenter les variables nécessaires sans exposer les vraies valeurs. Ces fichiers sont commités dans le repository et servent de template.

Les valeurs sensibles sont remplacées par des placeholders comme `your-database-password` ou `your-super-secret-key`. Des commentaires expliquent le format attendu et donnent des indications sur la génération des secrets.

Le fichier backend inclut un commentaire suggérant d'utiliser `openssl rand -base64 32` pour générer un secret JWT sécurisé. Cette commande produit une chaîne aléatoire de 256 bits encodée en base64.

**Chargement des variables**

Le backend utilise le package `DotNetEnv` pour charger les variables depuis le fichier .env au démarrage. Le code vérifie d'abord l'existence du fichier avant de le charger, évitant ainsi une erreur en production où les variables sont injectées autrement.

Les variables sont ensuite récupérées via `Environment.GetEnvironmentVariable`. Cette approche fonctionne aussi bien avec les fichiers .env locaux qu'avec les variables d'environnement Azure en production.

### 8.2 : Consolidation des .gitignore

Le projet contenait initialement plusieurs fichiers .gitignore dispersés dans différents dossiers. Cette organisation créait de la confusion et des risques d'oubli.

**Problème identifié**

Un fichier .env du frontend s'était retrouvé commité car le .gitignore du dossier frontend ne contenait pas l'entrée `.env`, seulement `.env.local` et les variantes. Cette omission représentait un risque de sécurité.

Par ailleurs, avoir trois .gitignore différents compliquait la maintenance. Les règles devaient être dupliquées et synchronisées manuellement entre les fichiers.

**Solution adoptée**

Tous les .gitignore des sous-dossiers ont été supprimés au profit d'un unique .gitignore à la racine du repository. Ce fichier centralise toutes les règles d'exclusion pour l'ensemble du projet.

Les patterns utilisent des wildcards pour couvrir tous les emplacements. Par exemple, `**/.env` exclut les fichiers .env quel que soit leur emplacement dans l'arborescence. De même pour `**/node_modules/` et `**/bin/`.

Cette approche simplifie grandement la gestion. Une seule source de vérité pour toutes les règles d'exclusion. Aucun risque d'oubli dans un sous-dossier.

**Nettoyage du repository**

Le fichier .env du frontend déjà commité a été retiré du tracking Git via `git rm --cached`. Cette commande supprime le fichier de l'historique Git sans le supprimer physiquement du disque.

Un commit d'amendement a corrigé le commit problématique pour retirer ce fichier sensible. Le fichier reste présent localement pour le développement mais n'est plus tracké par Git.

### 8.3 : Génération du secret JWT

Le fichier .env backend contenait initialement un placeholder pour le secret JWT. Pour l'environnement de développement, un vrai secret devait être généré.

La commande `openssl rand -base64 32` a été utilisée pour générer une chaîne aléatoire cryptographiquement sûre. Cette commande est disponible sur tous les systèmes Unix-like et peut être installée sur Windows.

Le secret généré a été inséré dans le fichier .env local, remplaçant le placeholder. Cette valeur reste strictement locale et n'est jamais commitée grâce au .gitignore.

Pour la production sur Azure, un nouveau secret doit être généré et configuré dans les Application Settings. Ne jamais réutiliser le même secret entre environnements.

---

## Merge et Consolidation

### Intégration dans develop

Les trois branches feature ont été mergées successivement dans develop en respectant leurs dépendances.

La branche `feature/online-multiplayer` a été mergée en premier. Elle apportait les fondations nécessaires pour les modes de jeu multiples et la gestion du stockage hybride.

Ensuite, `feature/authentication-jwt` a été intégrée. Cette branche dépendait des changements de structure effectués dans la précédente, notamment au niveau de l'organisation des services.

Enfin, un commit direct sur develop a consolidé la configuration des .gitignore et des .env. Ce changement transversal affectait l'ensemble du projet.

Chaque merge a été effectué avec l'option `--no-ff` pour préserver l'historique des branches. Les messages de merge décrivent clairement le contenu intégré.

### État actuel du projet

Le backend dispose maintenant d'un système d'authentification complet, d'une gestion multi-modes du stockage, et d'une architecture préparée pour le multijoueur en ligne. La base de données contient trois tables : Games, Players et Users.

Le frontend a été entièrement développé avec une architecture Atomic Design. Tous les composants nécessaires au jeu local et contre l'IA sont implémentés. L'intégration de l'authentification côté frontend reste à faire.

La configuration est sécurisée avec des variables d'environnement bien gérées. Le .gitignore consolidé empêche toute fuite accidentelle de secrets. Les fichiers .env.example documentent les variables nécessaires.

Les migrations de base de données sont à jour et appliquées automatiquement au démarrage de l'API. Le système est prêt pour l'ajout de nouvelles fonctionnalités sans refactoring majeur.

### Prochaines étapes techniques

L'intégration de l'authentification dans le frontend constitue la prochaine priorité. Les composants LoginForm et RegistrationForm doivent être complétés pour appeler les endpoints backend.

Le stockage du token JWT côté client nécessite une implémentation sécurisée. Le localStorage est une option simple mais un cookie httpOnly serait plus sûr pour une vraie application de production.

Les endpoints de jeu devront être protégés avec l'attribut `[Authorize]` pour restreindre l'accès aux utilisateurs authentifiés. L'extraction de l'identifiant utilisateur depuis les claims JWT permettra d'associer les parties aux comptes.

Le système de rooms et de lobby représente la prochaine grande feature. Il nécessitera probablement l'implémentation de WebSockets avec SignalR pour la communication temps réel entre joueurs.

Enfin, un système de matchmaking pourra être ajouté pour connecter automatiquement des joueurs cherchant une partie. Ce système pourrait prendre en compte des critères comme le niveau de jeu ou les préférences.