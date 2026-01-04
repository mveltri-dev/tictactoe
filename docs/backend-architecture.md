# Architecture Backend – Documentation détaillée

## Vue d’ensemble

Le backend du projet TicTacToe est développé en .NET 10, structuré selon les principes de la Clean Architecture. L’objectif est de garantir la maintenabilité, la testabilité et l’évolutivité du code, tout en facilitant l’intégration de nouvelles fonctionnalités (multijoueur, IA, scoring, etc.).

---

## Choix d’architecture et organisation

Le découpage en couches permet de séparer clairement la logique métier, l’orchestration applicative, l’accès aux données et l’exposition des endpoints HTTP. Ce choix facilite :
- la modification indépendante de chaque couche
- l’ajout de nouveaux services (ex : SignalR, scoring)
- la testabilité (mocks, DI)
- la sécurité (aucune dépendance externe dans le cœur métier)

### Structure des dossiers

```
src/backend/
├── Domain/          # Entités métier, enums
├── Application/     # DTOs, mappers, logique applicative
├── Infrastructure/  # Database, services, SignalR, migrations
└── Api/             # Controllers REST
```

---

## Domain Layer

- Entités principales : Game, Player, User, Room, Friendship
- Enums : GameStatus, GameMode, PlayerSymbol, PlayerType
- Logique métier pure, sans dépendance technique

---

## Application Layer

- DTOs pour chaque flux (GameDTO, PlayerDTO, AuthResponse, UserDTO)
- Mappers pour conversion Entity <-> DTO
- Orchestration des cas d’usage (création de partie, move, login, etc.)

---

## Infrastructure Layer

- Accès aux données via Entity Framework Core (PostgreSQL)
- Services techniques : AuthService (JWT, BCrypt), GameService, SignalRNotificationService
- Gestion des migrations, configuration, stockage hybride (mémoire/DB)
- Intégration SignalR pour le temps réel (multijoueur, notifications)

### SignalR et temps réel

Le backend intègre SignalR pour permettre :
- la synchronisation des parties en ligne
- l’envoi de notifications aux joueurs (moves, victoire, chat, etc.)
- la gestion des rooms et du matchmaking

Le hub principal (`GameHub.cs`) expose les méthodes d’abonnement, de diffusion des moves et d’événements de jeu. L’architecture est prête pour l’ajout de chat et d’autres interactions temps réel.

---

## API Layer

- Controllers REST : GameController, AuthController, UserController, MatchmakingController, FriendsController
- Endpoints typés, validation systématique des entrées
- Gestion des erreurs (400, 401, 404, 500) et des statuts HTTP
- Swagger activé en développement pour la documentation interactive

---

## Flux de données (exemple narratif)

**Création d’une partie**
1. Le client envoie un POST `/api/game` avec les paramètres
2. Le controller valide et transmet à GameService
3. GameService crée les entités Game et Player, sauvegarde en DB
4. Le résultat est mappé en GameDTO et renvoyé au frontend

**Move / temps réel**
1. Le client joue un coup (POST `/api/game/{id}/move` ou via SignalR)
2. Le backend valide, met à jour le board, vérifie la victoire
3. Si multijoueur, SignalR diffuse le move à l’autre joueur
4. Le statut du jeu est mis à jour et renvoyé

---

## Sécurité et gestion des erreurs

- Authentification JWT, hashing des mots de passe avec BCrypt
- Validation stricte des entrées (DTOs, controllers)
- Gestion des statuts HTTP et des exceptions (ArgumentException, UnauthorizedAccessException, etc.)
- CORS configuré pour limiter les origines autorisées

---

## Extensibilité et évolutivité

- Ajout de nouveaux modes de jeu (GameMode, IA avancée)
- Intégration de nouvelles entités (Room, Friendship)
- Architecture prête pour le chat, le scoring avancé, le monitoring
- Stockage hybride (mémoire pour parties locales, DB pour online)

---

## Limites connues / axes d’amélioration

- Problème SignalR en environnement cloud (notifications et authentification en ligne)
- Gestion des rooms et matchmaking à finaliser
- Tests unitaires et d’intégration à renforcer
- Monitoring et logs à améliorer
- Sécurité à auditer pour production

---

## Commandes utiles

- Lancement : `dotnet run --project Api.csproj`
- Migrations : `dotnet ef migrations add <Nom> --startup-project ../Api`
- Mise à jour DB : `dotnet ef database update --startup-project ../Api`
- Build : `dotnet build`
- Restauration : `dotnet restore`

---

## Packages principaux

- .NET 10, Entity Framework Core, Npgsql, BCrypt.Net, System.IdentityModel.Tokens.Jwt, Swashbuckle (Swagger), SignalR

---

## Structure complète (rappel)

```
src/backend/
├── Api/
│   ├── Controllers/
│   ├── Program.cs
│   └── ...
├── Application/
│   ├── DTOs/
│   ├── Mappers/
│   └── ...
├── Domain/
│   ├── Entities/
│   ├── Enums/
│   └── ...
└── Infrastructure/
    ├── Database/
    ├── Services/
    ├── Migrations/
    └── ...
```

---

## Pour aller plus loin

- Voir la documentation SignalR et multijoueur dans `online-multiplayer-features.md`
- Les variables d’environnement et la configuration cloud sont détaillées dans `env-variables.md` et `deploiement-azure.md`

---

**Dernière mise à jour : 4 janvier 2026**
