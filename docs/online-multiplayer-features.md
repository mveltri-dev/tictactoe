#  Features Multijoueur en Ligne - Documentation

##  Vue d'ensemble

Implémentation des features préparatoires pour le mode multijoueur en ligne.

**Branche**: `feature/online-multiplayer` → Mergée dans `develop`  
**Date**: Janvier 2026  
**Statut**:  Backend prêt (en attente WebSockets et Rooms)

---

##  Features implémentées

### 1. Tracking de la ligne gagnante

#### Game.cs - Nouvelle propriété
```csharp
public int[]? WinningLine { get; private set; }

public void SetWinningLine(int[] positions)
{
    if (positions == null || positions.Length != 3)
    {
        throw new ArgumentException("La ligne gagnante doit contenir exactement 3 positions");
    }
    WinningLine = positions;
}
```

**Utilité**:
- Animation visuelle de la victoire dans le frontend
- Savoir quelle combinaison a gagné
- UX améliorée (highlight des cases)

**Positions possibles**:
```
Plateau:     Index array:
 0 | 1 | 2      [0, 1, 2]
-----------     [3, 4, 5]
 3 | 4 | 5      [6, 7, 8]
-----------
 6 | 7 | 8

Lignes gagnantes:
- Horizontales: [0,1,2], [3,4,5], [6,7,8]
- Verticales: [0,3,6], [1,4,7], [2,5,8]
- Diagonales: [0,4,8], [2,4,6]
```

#### GameService.cs - Mise à jour
```csharp
private (PlayerSymbol? winner, int[]? winningLine) CheckWinner(int[] board)
{
    int[][] winPatterns = {
        new[] { 0, 1, 2 }, // Ligne 1
        new[] { 3, 4, 5 }, // Ligne 2
        new[] { 6, 7, 8 }, // Ligne 3
        new[] { 0, 3, 6 }, // Colonne 1
        new[] { 1, 4, 7 }, // Colonne 2
        new[] { 2, 5, 8 }, // Colonne 3
        new[] { 0, 4, 8 }, // Diagonale \
        new[] { 2, 4, 6 }  // Diagonale /
    };

    foreach (var pattern in winPatterns)
    {
        if (board[pattern[0]] != 0 &&
            board[pattern[0]] == board[pattern[1]] &&
            board[pattern[1]] == board[pattern[2]])
        {
            return ((PlayerSymbol)board[pattern[0]], pattern);
        }
    }

    return (null, null);
}
```

**Retour**:
- `(PlayerSymbol.X, [0, 1, 2])` si X gagne avec ligne du haut
- `(null, null)` si pas de gagnant

**Utilisation dans PlayMoveAsync**:
```csharp
var (winner, winningLine) = CheckWinner(board);
if (winner.HasValue)
{
    game.UpdateStatus(winner == PlayerSymbol.X ? GameStatus.XWins : GameStatus.OWins);
    if (winningLine != null)
    {
        game.SetWinningLine(winningLine);
    }
}
```

#### GameDTO.cs - Exposition
```csharp
public int[]? WinningLine { get; set; }
```

**Réponse API**:
```json
{
  "id": "...",
  "board": [1, 1, 1, 2, 2, 0, 0, 0, 0],
  "status": "XWins",
  "winningLine": [0, 1, 2],
  "players": [...]
}
```

---

### 2. Endpoint AI Move Asynchrone

#### Problème résolu

**Avant**: Frontend devait appeler `/move` puis calculer coup IA  
**Après**: Backend gère le coup IA en un seul appel

#### GameController.cs - Nouveau endpoint

```csharp
[HttpPost("{id}/ai-move")]
public async Task<ActionResult<GameDTO>> PlayAIMove(Guid id)
{
    try
    {
        var game = await _gameService.GetGameByIdAsync(id);
        
        if (game == null)
        {
            return NotFound(new { error = "Partie non trouvée" });
        }

        // Vérifications
        if (game.Mode != GameMode.VsAI)
        {
            return BadRequest(new { error = "Ce endpoint est uniquement pour le mode VsAI" });
        }

        if (game.Status != GameStatus.InProgress)
        {
            return BadRequest(new { error = "La partie est terminée" });
        }

        // Récupérer joueur IA
        var aiPlayer = game.Players.FirstOrDefault(p => p.Type == PlayerType.AI);
        if (aiPlayer == null)
        {
            return BadRequest(new { error = "Aucun joueur IA trouvé" });
        }

        // Vérifier que c'est au tour de l'IA
        if (game.CurrentPlayerSymbol != aiPlayer.Symbol)
        {
            return BadRequest(new { error = "Ce n'est pas au tour de l'IA" });
        }

        // IA joue
        var updatedGame = await _gameService.PlayAIMoveAsync(id);
        
        if (updatedGame == null)
        {
            return NotFound(new { error = "Erreur lors du coup de l'IA" });
        }

        return Ok(GameMapper.ToDTO(updatedGame));
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { error = ex.Message });
    }
}
```

**Endpoint**: `POST /api/game/{id}/ai-move`  
**Body**: Aucun  
**Response**: 200 OK + GameDTO (avec coup IA joué)

**Validations**:
-  Mode doit être VsAI
-  Partie doit être InProgress
-  Doit être au tour de l'IA
-  Joueur IA doit exister

#### GameService.cs - Logique IA

```csharp
public async Task<Game?> PlayAIMoveAsync(Guid gameId)
{
    var game = await GetGameByIdAsync(gameId);
    if (game == null) return null;

    // Trouver case vide
    var emptyPositions = new List<int>();
    for (int i = 0; i < game.Board.Length; i++)
    {
        if (game.Board[i] == 0)
        {
            emptyPositions.Add(i);
        }
    }

    if (emptyPositions.Count == 0)
    {
        return game; // Plateau plein
    }

    // IA joue aléatoirement (pour l'instant)
    var random = new Random();
    var position = emptyPositions[random.Next(emptyPositions.Count)];

    // Jouer le coup
    return await PlayMoveAsync(gameId, position);
}
```

**Algorithme actuel**: Aléatoire  
**Améliorations futures possibles**:
- Minimax algorithm
- Alpha-beta pruning
- Stratégie défensive (bloquer victoire adverse)
- Stratégie offensive (jouer centre, coins)

**Flux complet VsAI**:
```
1. Frontend: POST /game (mode: VsAI)
   ← Game créé, joueur humain = X, IA = O

2. Frontend: POST /game/{id}/move (position: 4)
   ← Humain joue au centre
   
3. Frontend: POST /game/{id}/ai-move
   ← IA joue automatiquement
   ← Game mis à jour avec coup IA

4. Répéter 2-3 jusqu'à fin partie
```

---

### 3. Stockage Hybride (Mémoire + Database)

#### Problème

**Avant**: Toutes parties en base de données  
**Inconvénient**: Latence pour parties locales, overhead DB

**Solution**: Stockage selon le mode de jeu

#### GameService.cs - Dictionnaire en mémoire

```csharp
public class GameService
{
    private readonly TicTacToeDbContext _context;
    
    // Storage en mémoire pour parties locales
    private static readonly Dictionary<Guid, Game> _inMemoryGames 
        = new Dictionary<Guid, Game>();

    private bool ShouldPersistToDatabase(GameMode mode)
    {
        return mode == GameMode.VsPlayerOnline;
    }
    
    // ...
}
```

**Règles de stockage**:

| Mode | Storage | Raison |
|------|---------|--------|
| `VsPlayer` | Mémoire | Local, pas besoin persistance |
| `VsAI` | Mémoire | Local, temporaire |
| `VsPlayerOnline` | Database | Multi-device, multi-session |

#### CreateGameAsync - Stockage conditionnel

```csharp
public async Task<Game> CreateGameAsync(
    GameMode mode, 
    string? player1Name, 
    string? player2Name)
{
    var game = new Game(
        new int[9],
        GameStatus.InProgress,
        PlayerSymbol.X,
        mode
    );

    // Créer joueurs
    var player1 = new Player(game.Id, PlayerSymbol.X, 
        mode == GameMode.VsAI ? PlayerType.Human : PlayerType.Human, 
        player1Name);
    
    var player2 = new Player(game.Id, PlayerSymbol.O, 
        mode == GameMode.VsAI ? PlayerType.AI : PlayerType.Human, 
        player2Name);

    if (ShouldPersistToDatabase(mode))
    {
        // Storage DB pour online
        _context.Games.Add(game);
        _context.Players.AddRange(player1, player2);
        await _context.SaveChangesAsync();
    }
    else
    {
        // Storage mémoire pour local
        _inMemoryGames[game.Id] = game;
        game.Players.Add(player1);
        game.Players.Add(player2);
    }

    return game;
}
```

#### GetGameByIdAsync - Récupération hybride

```csharp
public async Task<Game?> GetGameByIdAsync(Guid gameId)
{
    // Check mémoire d'abord
    if (_inMemoryGames.TryGetValue(gameId, out var inMemoryGame))
    {
        return inMemoryGame;
    }

    // Sinon check DB
    return await _context.Games
        .Include(g => g.Players)
        .FirstOrDefaultAsync(g => g.Id == gameId);
}
```

**Performance**:
- Mémoire: O(1) lookup
- Database: O(log n) avec index + latence réseau

#### PlayMoveAsync - Sauvegarde conditionnelle

```csharp
public async Task<Game?> PlayMoveAsync(Guid gameId, int position)
{
    var game = await GetGameByIdAsync(gameId);
    if (game == null) return null;

    // Validation + logique de jeu...
    
    // Sauvegarder si DB
    if (ShouldPersistToDatabase(game.Mode))
    {
        await _context.SaveChangesAsync();
    }
    // Sinon déjà à jour en mémoire

    return game;
}
```

#### Avantages

 **Performance**: Parties locales ultra-rapides (pas de DB)  
 **Scalabilité**: DB uniquement pour online (moins de charge)  
 **Flexibilité**: Facile de changer stratégie par mode  
 **Cohérence**: Même API pour tous les modes  

#### Limitations

 **Mémoire volatile**: Restart serveur = perte parties locales  
 **Pas de replay**: Parties locales non sauvegardées  
 **Mono-instance**: Dictionary partagé entre requêtes (thread-safe à vérifier)  

**Solutions futures**:
- Redis pour cache distribué
- Session storage côté client pour parties locales
- Background job pour archiver parties terminées

---

##  Modifications dans les entités

### Game.cs

**Avant**:
```csharp
public class Game {
    public Guid Id { get; private set; }
    public int[] Board { get; private set; }
    public GameStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public PlayerSymbol CurrentPlayerSymbol { get; private set; }
    public GameMode Mode { get; private set; }
}
```

**Après**:
```csharp
public class Game {
    // ... propriétés existantes
    public int[]? WinningLine { get; private set; } //  NEW
    public List<Player> Players { get; private set; } = new(); //  NEW
    
    public void SetWinningLine(int[] positions) { } //  NEW
}
```

### GameDTO.cs

**Avant**:
```csharp
public class GameDTO {
    public Guid Id { get; set; }
    public int[] Board { get; set; }
    public string Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CurrentPlayerSymbol { get; set; }
    public string Mode { get; set; }
    public List<PlayerDTO> Players { get; set; }
}
```

**Après**:
```csharp
public class GameDTO {
    // ... propriétés existantes
    public int[]? WinningLine { get; set; } //  NEW
}
```

---

##  Migration Database

### AddUserEntity (20260102181524)

Cette migration inclut aussi:

```csharp
migrationBuilder.AddColumn<string>(
    name: "WinningLine",
    table: "Games",
    type: "jsonb",
    nullable: true);
```

**Type**: JSONB (array PostgreSQL)  
**Nullable**: Oui (null si pas de gagnant)  
**Format stocké**: `[0, 1, 2]` (3 entiers)

---

##  Flux de jeu complet

### Mode VsPlayer (local)

```
1. POST /api/game
   Body: { "mode": "VsPlayer", "player1Name": "Alice", "player2Name": "Bob" }
   Storage: Mémoire
   ← Game créé
   
2. POST /api/game/{id}/move
   Body: { "position": 4 }
   Storage: Mémoire (mis à jour)
   ← Game après coup joueur 1
   
3. POST /api/game/{id}/move
   Body: { "position": 0 }
   Storage: Mémoire (mis à jour)
   ← Game après coup joueur 2
   
4. ... jusqu'à victoire ou match nul
   ← Game final avec WinningLine: [0, 1, 2]
```

### Mode VsAI (contre ordinateur)

```
1. POST /api/game
   Body: { "mode": "VsAI", "player1Name": "Alice" }
   Storage: Mémoire
   ← Game créé (player2 = AI)
   
2. POST /api/game/{id}/move
   Body: { "position": 4 }
   Storage: Mémoire
   ← Humain joue
   
3. POST /api/game/{id}/ai-move
   Body: (vide)
   Storage: Mémoire
   ← IA joue automatiquement
   
4. Répéter 2-3 jusqu'à fin
```

### Mode VsPlayerOnline (multijoueur)

```
1. POST /api/game
   Body: { "mode": "VsPlayerOnline" }
   Storage: Database
   ← Game créé
   
2. [Player 1] POST /api/game/{id}/move
   Body: { "position": 4 }
   Storage: Database
   ← Game mis à jour
   
3. [Player 2] GET /api/game/{id}
   ← Récupère état à jour
   
4. [Player 2] POST /api/game/{id}/move
   Body: { "position": 0 }
   Storage: Database
   ← Game mis à jour
   
5. Répéter avec WebSocket notifications (future)
```

---

##  Prochaines étapes

### Backend (À implémenter)

- [ ] **WebSockets** pour notifications temps réel
  - SignalR ou Socket.IO
  - Events: PlayerJoined, MovePlayed, GameEnded
  
- [ ] **Rooms/Lobby** system
  - Créer/rejoindre rooms
  - Matchmaking automatique
  - Room status (waiting, playing, finished)
  
- [ ] **IA intelligente**
  - Minimax algorithm
  - Niveaux de difficulté (Easy, Medium, Hard)
  
- [ ] **User association**
  - Game.Player1Id, Game.Player2Id (FK → Users)
  - Historique des parties par utilisateur
  - Statistiques (victoires, défaites, draws)

### Frontend (À implémenter)

- [ ] Animation de la ligne gagnante
  - Utiliser `winningLine` pour highlight
  - Transition CSS sur cases gagnantes
  
- [ ] Mode IA
  - Bouton "Jouer contre l'IA"
  - Appel automatique `/ai-move` après coup humain
  - Loader pendant calcul IA
  
- [ ] Lobby online
  - Liste des rooms disponibles
  - Créer/rejoindre room
  - Attente adversaire

---

##  Fichiers modifiés

```
src/backend/
├── Domain/
│   └── Entities/
│       └── Game.cs                      +WinningLine, +SetWinningLine()
│
├── Application/
│   ├── DTOs/
│   │   └── Responses/
│   │       └── GameDTO.cs               +WinningLine
│   └── Mappers/
│       └── GameMapper.cs                Mapping WinningLine
│
├── Infrastructure/
│   ├── Database/
│   │   └── Configurations/
│   │       └── GameConfiguration.cs     Config JSONB WinningLine
│   ├── Migrations/
│   │   └── 20260102181524_AddUserEntity.cs   +WinningLine column
│   └── Services/
│       └── GameService.cs               Stockage hybride, IA, WinningLine
│
└── Api/
    └── Controllers/
        └── GameController.cs            +PlayAIMove endpoint
```

---

##  Tests manuels

### Test 1: Winning line tracking

```bash
# Créer partie
curl -X POST http://localhost:5000/api/game \
  -H "Content-Type: application/json" \
  -d '{"mode":"VsPlayer"}'

# Jouer coups gagnants
curl -X POST http://localhost:5000/api/game/{id}/move \
  -H "Content-Type: application/json" \
  -d '{"position":0}'  # X

curl -X POST http://localhost:5000/api/game/{id}/move \
  -d '{"position":3}'  # O

curl -X POST http://localhost:5000/api/game/{id}/move \
  -d '{"position":1}'  # X

curl -X POST http://localhost:5000/api/game/{id}/move \
  -d '{"position":4}'  # O

curl -X POST http://localhost:5000/api/game/{id}/move \
  -d '{"position":2}'  # X gagne!

# Response devrait inclure:
# "status": "XWins"
# "winningLine": [0, 1, 2]
```

**Résultat attendu**:  WinningLine = [0, 1, 2]

### Test 2: AI move endpoint

```bash
# Créer partie VsAI
curl -X POST http://localhost:5000/api/game \
  -H "Content-Type: application/json" \
  -d '{"mode":"VsAI","player1Name":"Human"}'

# Humain joue
curl -X POST http://localhost:5000/api/game/{id}/move \
  -d '{"position":4}'

# IA joue
curl -X POST http://localhost:5000/api/game/{id}/ai-move

# Response: Game avec coup IA joué
# currentPlayerSymbol devrait être "X" (retour au humain)
```

**Résultat attendu**:  IA joue case aléatoire disponible

### Test 3: Stockage hybride

```bash
# Partie locale (VsPlayer)
POST /api/game {"mode":"VsPlayer"}
# → Stocké en mémoire

# Partie online (VsPlayerOnline)
POST /api/game {"mode":"VsPlayerOnline"}
# → Stocké en database

# Vérifier DB:
SELECT COUNT(*) FROM "Games" WHERE "Mode" = 2;
# → Devrait montrer seulement parties VsPlayerOnline
```

**Résultat attendu**:  VsPlayer en mémoire, VsPlayerOnline en DB

---

##  Métriques

**Lignes de code modifiées**: ~300  
**Fichiers modifiés**: 7  
**Nouveaux endpoints**: 1 (POST /api/game/{id}/ai-move)  
**Nouvelles propriétés**: 2 (WinningLine, Players navigation)  
**Tests manuels**: 3/3 passés   

---

##  Points clés

###  Avantages implémentation

1. **WinningLine**: Frontend peut animer victoire sans recalculer
2. **AI endpoint**: Un seul appel pour tour complet IA
3. **Stockage hybride**: Performance optimale par mode
4. **Rétrocompatibilité**: API inchangée pour endpoints existants

###  Considérations

1. **Thread safety**: Dictionary statique peut avoir race conditions
2. **Mémoire limitée**: Pas de cleanup des parties terminées
3. **IA basique**: Aléatoire pour l'instant, à améliorer
4. **Pas de temps réel**: WebSockets nécessaires pour online fluide

---

**Dernière mise à jour**: 2 janvier 2026  
**Branche**: Mergée dans `develop`  
**Prochaine feature**: Rooms/Lobby system + WebSockets
