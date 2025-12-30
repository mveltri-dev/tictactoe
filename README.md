# TicTacToe — Full-Stack Application

Projet TicTacToe full-stack avec **backend en C# (.NET 10)** utilisant la **Clean Architecture** et **frontend React + TypeScript** avec l'**Atomic Design**.

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **.NET 10 SDK** ([Télécharger](https://dotnet.microsoft.com/download))
- **Node.js 18+** et **npm** ([Télécharger](https://nodejs.org/))
- **Git**

---

## Architecture du Projet

```
tictactoe/
├── README.md
├── tictactoe.sln
├── .gitignore
├── .gitattributes
│
└── src/
    │
    ├── backend/                          # Backend .NET 10
    │   │
    │   ├── Domain/                       # Couche Domaine
    │   │   ├── Domain.csproj
    │   │   ├── Entities/                 # Entités métier (Game, Player, Move)
    │   │   └── Enums/                    # Énumérations (GameStatus, PlayerSymbol)
    │   │
    │   ├── Application/                  # Couche Application
    │   │   ├── Application.csproj
    │   │   ├── DTOs/                     # Data Transfer Objects
    │   │   └── Services/                 # Services métier (GameService)
    │   │
    │   ├── Infrastructure/               # Couche Infrastructure
    │   │   ├── Infrastructure.csproj
    │   │   └── Database/                 # Configuration base de données
    │   │
    │   └── Api/                          # Couche Présentation (API REST)
    │       ├── Api.csproj
    │       ├── Program.cs
    │       └── Controllers/              # Contrôleurs API
    │
    └── frontend/                         # Frontend React + TypeScript
        ├── index.html
        ├── package.json
        ├── tsconfig.json
        ├── vite.config.ts
        │
        └── src/
            ├── main.tsx                  # Point d'entrée
            │
            ├── components/               # Atomic Design
            │   ├── atoms/                # Composants de base (Button, Input)
            │   ├── molecules/            # Combinaisons simples (Cell)
            │   ├── organisms/            # Composants complexes (Board)
            │   └── templates/            # Mises en page réutilisables
            │
            ├── pages/                    # Pages de l'application
            │   └── App.tsx
            │
            ├── hooks/                    # Hooks personnalisés
            │   └── useGame.ts
            │
            ├── services/                 # Services API
            │   └── api.ts
            │
            ├── types/                    # Types TypeScript
            │   └── dto.ts
            │
            └── styles/                   # Styles CSS/SCSS
```

---

## Démarrage Rapide

### Backend (.NET 10)

```bash
# Se placer dans le dossier backend
cd src/backend

# Restaurer les dépendances
dotnet restore

# Lancer l'API
dotnet run --project Api
```

L'API sera accessible sur : `http://localhost:5000` (ou le port configuré)

### Frontend (React + Vite)

```bash
# Se placer dans le dossier frontend
cd src/frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur : `http://localhost:5173`

---

## Scripts Disponibles

### Frontend

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement Vite |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualise le build de production |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run format` | Formate le code avec Prettier |

### Backend

| Commande | Description |
|----------|-------------|
| `dotnet restore` | Restaure les dépendances NuGet |
| `dotnet build` | Compile le projet |
| `dotnet run --project Api` | Lance l'API en mode développement |
| `dotnet test` | Lance les tests unitaires (à venir) |

---

## Architecture et Principes

### Backend — Clean Architecture

La structure backend suit les principes de la **Clean Architecture** :

- **Domain** : Entités métier pures, sans dépendances externes
- **Application** : Logique métier, use cases, DTOs
- **Infrastructure** : Implémentation de l'accès aux données
- **Api** : Couche de présentation (contrôleurs REST)

**Dépendances** : Domain ← Application ← Infrastructure ← Api

### Frontend — Atomic Design

Le frontend utilise la méthodologie **Atomic Design** :

- **Atoms** : Composants de base réutilisables (boutons, inputs)
- **Molecules** : Combinaisons d'atoms (case du jeu)
- **Organisms** : Composants complexes (plateau de jeu)
- **Templates** : Mises en page
- **Pages** : Pages complètes avec données

---

## Technologies Utilisées

### Backend
- **.NET 10** — Framework backend
- **ASP.NET Core** — API REST
- **Entity Framework Core** — ORM (optionnel)

### Frontend
- **React 18** — Bibliothèque UI
- **TypeScript 5** — Typage statique
- **Vite 5** — Bundler et serveur de développement
- **ESLint** — Linter
- **Prettier** — Formateur de code

---

## Notes Importantes

- Structure du projet optimisée et simplifiée pour un jeu Tic-Tac-Toe
- Aucune logique métier implémentée à ce stade (branche `feature/initial-setup`)
- Les dossiers `bin/`, `obj/` et `node_modules/` sont ignorés par Git
- Projet prêt pour le développement des fonctionnalités

---

## Contribution

1. Créer une branche feature (`git checkout -b feature/ma-fonctionnalite`)
2. Commiter les changements (`git commit -m 'Ajout de ma fonctionnalité'`)
3. Pousser la branche (`git push origin feature/ma-fonctionnalite`)
4. Ouvrir une Pull Request vers `develop`

---

## Licence

Ce projet est sous licence MIT.
