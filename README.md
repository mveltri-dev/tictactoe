# TicTacToe

Application TicTacToe complète avec backend .NET 10 et frontend React + TypeScript.

## Démarrage Rapide

### Prérequis

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/download/) (ou accès à une base Azure)

### Configuration de la base de données

1. Créer un fichier `.env` dans `src/backend/` :

```bash
# Database
DB_HOST=votre-serveur.postgres.database.azure.com
DB_USER=votre_utilisateur
DB_NAME=postgres
DB_PASSWORD=votre_mot_de_passe
DB_PORT=5432

# JWT
JWT_SECRET=votre_secret_genere_avec_openssl_rand_base64_32
JWT_ISSUER=TicTacToeApi
JWT_AUDIENCE=TicTacToeClient
```

2. Appliquer les migrations :

```bash
cd src/backend/Infrastructure
dotnet ef database update --startup-project ../Api
```

dotnet ef database update --startup-project ../Api
```

### Lancer le backend

```bash
cd src/backend/Api
dotnet run --project Api.csproj
```

L'API sera accessible sur `http://localhost:5000`

### Lancer le frontend

```bash
cd src/frontend
npm install
npm run dev
```
 
L'application sera accessible sur `http://localhost:5173`
 
## Fonctionnalités

### Modes de jeu

1. **Vs Player Local** : Deux joueurs sur le même appareil
2. **Vs Computer** : Jouer contre l'IA (placement aléatoire)
3. **Vs Player Online** : Multijoueur en ligne (nécessite compte utilisateur)

### Système d'authentification

- Inscription et connexion avec JWT
- Historique des parties jouées
- Statistiques personnelles (victoires, défaites, ratio)

### Rejouer facilement

- Bouton "Nouvelle partie" après chaque fin de partie
- Aucun rechargement de page nécessaire
- Choix du mode de jeu à chaque nouvelle partie

## Architecture

### Backend - Clean Architecture

```
src/backend/
├── Domain/          # Entités métier (Game, Player, User)
├── Application/     # DTOs et logique applicative
├── Infrastructure/  # Database, Services, Migrations
└── Api/            # Controllers REST
```

**Technologies :**
- .NET 10
- Entity Framework Core
- PostgreSQL
- JWT Authentication
- BCrypt pour les mots de passe

### Frontend - Atomic Design

```
src/frontend/
└── src/
    ├── components/
    │   ├── atoms/      # Boutons, inputs
    │   ├── molecules/  # Cellules du plateau
    │   ├── organisms/  # Plateau complet
    │   └── templates/  # Layouts
    ├── pages/          # Pages de l'app
    ├── hooks/          # Logique réutilisable
    └── services/       # API calls
```

**Technologies :**
- React 18
- TypeScript
- Vite
- Tailwind CSS

## API Endpoints

### Authentification

- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter

### Partie

- `POST /api/game` - Créer une partie
- `GET /api/game/{id}` - Récupérer une partie
- `POST /api/game/{id}/move` - Jouer un coup
- `POST /api/game/{id}/ai-move` - L'IA joue (mode VsComputer)

### Historique (nécessite authentification)

- `GET /api/game/history` - Historique de l'utilisateur
- `GET /api/game/stats` - Statistiques de l'utilisateur

## Évolutivité

Le code est conçu pour être facilement extensible :

- **Taille du plateau** : Support natif des grilles NxM (actuellement 3x3)
- **Nouveaux modes** : Architecture permet d'ajouter facilement de nouveaux GameMode
- **IA améliorée** : Service dédié remplaçable par algorithme intelligent (Minimax)
- **WebSockets** : Architecture prête pour ajout de temps réel

## Tests

### Tester l'API avec curl

```bash
# Créer un utilisateur
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"joueur1","email":"joueur1@test.com","password":"password123"}'

# Créer une partie
curl -X POST http://localhost:5000/api/game \
  -H "Content-Type: application/json" \
  -d '{"mode":"VsComputer","player1Name":"Marie"}'

# Jouer un coup (remplacer {id} par l'ID de la partie)
curl -X POST http://localhost:5000/api/game/{id}/move \
  -H "Content-Type: application/json" \
  -d '{"position":4}'

# L'IA joue
curl -X POST http://localhost:5000/api/game/{id}/ai-move
```
 
## Documentation Technique

Documentation détaillée disponible dans `/docs` :

- [Architecture Backend](docs/backend-architecture.md)
- [Configuration Database](docs/database-setup.md)
- [Authentification JWT](docs/authentication-jwt.md)
- [Features Multijoueur](docs/online-multiplayer-features.md)
- [Documentation Frontend](docs/frontend-documentation.md)

## Auteur

Marie Veltri - Projet de recrutement EASI
