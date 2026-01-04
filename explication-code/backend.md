# 🛠️ Explication du backend – Architecture et Domain

## Architecture générale

Le backend est organisé en 4 couches principales :
1. **Domain** (Domaine) : le cœur de l’application, logique métier pure
2. **Application** : orchestration des cas d’usage, DTOs, mappers
3. **Infrastructure** : accès aux données, services techniques, intégrations
4. **Api** : exposition des endpoints HTTP, controllers, hubs

---

## 1. Domain (le cœur du backend)

La couche Domain contient tout ce qui définit le métier, sans dépendance technique :
- **Entités** : objets principaux du jeu (Game, Player, User, Room, Friendship)
- **Enums** : types énumérés pour décrire les statuts, modes, symboles, etc.

### Pourquoi ?
- Permet d’avoir une logique métier indépendante de la base de données ou du framework
- Facilite les tests, l’évolution (ex : passer de 3x3 à 4x4), la maintenabilité

---

### Entités Domain

Dans `Domain/Entities`, on retrouve :
- **Game.cs** : représente une partie de TicTacToe (voir fiche détaillée ci-dessus)
- **Player.cs** : représente un joueur dans une partie (voir fiche détaillée ci-dessus)
- **User.cs** : représente un utilisateur enregistré (authentification, profil)
- **Room.cs** : représente un salon de jeu pour le multijoueur en ligne
- **Friendship.cs** : représente une relation d’amitié entre deux utilisateurs

Chaque entité a un rôle précis et des propriétés adaptées à son usage métier.

---

### Enums Domain

Dans `Domain/Enums`, on retrouve :
- **GameStatus** : état d’une partie (en cours, XWins, OWins, Draw)
- **GameMode** : mode de jeu (VsAI, VsPlayerLocal, VsPlayerOnline)
- **PlayerSymbol** : X ou O
- **PlayerType** : Humain ou IA
- **RoomStatus** : état d’un salon (waiting, playing, finished)
- **FriendshipStatus** : statut d’une relation d’amitié

Les enums permettent de rendre le code plus lisible, typé et robuste.

---

Je peux maintenant détailler chaque entité ou enum selon tes besoins (voir fiches ci-dessus pour Game et Player). Dis-moi si tu veux la fiche User, Room, Friendship ou un enum particulier !

---

## 📄 Game.cs (Entité centrale du domaine)

### Rôle
Représente une partie de TicTacToe. C’est l’objet principal qui porte tout l’état du jeu.

### Propriétés principales
- **Id** : identifiant unique de la partie (UUID)
- **Width / Height** : dimensions du plateau (par défaut 3x3, mais extensible)
- **Board** : tableau représentant chaque case (X, O ou vide)
- **PlayerXId / PlayerOId** : identifiants des joueurs (liens vers User)
- **CurrentTurn** : à qui le tour (X ou O)
- **Status** : état de la partie (en cours, gagnée, nulle…)
- **WinnerId** : identifiant du gagnant (ou null)
- **WinningLine** : indices des cases gagnantes (pour l’animation)
- **Mode** : mode de jeu (VsComputer, VsPlayerLocal, VsPlayerOnline)
- **IsInvitationAccepted** : pour le multijoueur en ligne (room acceptée ou non)
- **CreatedAt** : date de création

### Méthodes importantes
- **SetWinningLine(int[] positions)** : enregistre la ligne gagnante pour l’UI

### Constructeur
- Initialise une partie avec les joueurs, le mode, la taille du plateau, etc.
- Par défaut, X commence toujours.
- Permet d’étendre facilement à des plateaux plus grands (4x4, etc.)

### Points à retenir pour l’entretien
- Cœur du métier : aucune dépendance technique (pas de DB, pas de framework)
- Conçue pour être évolutive (plateau NxN, modes de jeu…)
- Porte toute la logique d’état d’une partie (qui joue, qui gagne, etc.)
- Propriétés navigationnelles (`PlayerX`, `PlayerO`) pour lier avec User (Entity Framework)

---

## 📄 Player.cs (Domain/Entities)

### Rôle
Représente un joueur dans une partie de TicTacToe. Chaque partie référence deux joueurs (X et O).

### Propriétés principales
- **Id** : identifiant unique du joueur (UUID)
- **Name** : nom du joueur (saisi ou généré)
- **Symbol** : X ou O (PlayerSymbol)
- **Type** : humain ou ordinateur (PlayerType)

### Constructeur
- Crée un joueur avec nom, symbole et type
- Génère un nouvel Id unique

### Points à retenir pour l’entretien
- Fichier situé dans `Domain/Entities` (couche métier, sans dépendance technique)
- Permet de distinguer humain/IA et d’associer chaque joueur à un symbole
- Utilisé par Game pour référencer les participants
- Simple, mais extensible (ajout d’avatar, score, etc.)

---
