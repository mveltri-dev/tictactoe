using Domain.Entities;
using Domain.Enums;
using Application.DTOs.Requests;
using Application.DTOs.Responses;
using Application.Mappers;
using Application.Interfaces;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

/// <summary>
/// Service gérant la logique métier des parties de Tic-Tac-Toe.
/// </summary>
public class GameService
{
    private readonly TicTacToeDbContext _dbContext;
    private readonly IGameNotificationService? _notificationService;
    
    // Cache en mémoire pour les parties locales (VsComputer, VsLocal)
    private static readonly Dictionary<Guid, Game> _inMemoryGames = new();
    private static readonly Dictionary<Guid, Player> _inMemoryPlayers = new();
    private static readonly object _cacheLock = new();
    
    // Nettoyage automatique des parties de plus de 24h
    private static DateTime _lastCleanup = DateTime.UtcNow;
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromHours(1);
    private static readonly TimeSpan GameExpiration = TimeSpan.FromHours(24);

    public GameService(
        TicTacToeDbContext dbContext, 
        IGameNotificationService? notificationService = null)
    {
        _dbContext = dbContext;
        _notificationService = notificationService;
        CleanupExpiredGames();
    }

    /// <summary>
    /// Nettoie les parties expirées du cache mémoire.
    /// </summary>
    private static void CleanupExpiredGames()
    {
        lock (_cacheLock)
        {
            if (DateTime.UtcNow - _lastCleanup < CleanupInterval)
                return;

            var expiredGames = _inMemoryGames
                .Where(kvp => DateTime.UtcNow - kvp.Value.CreatedAt > GameExpiration)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var gameId in expiredGames)
            {
                _inMemoryGames.Remove(gameId);
            }

            _lastCleanup = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Vérifie si le mode de jeu nécessite la persistance en base de données.
    /// </summary>
    private static bool RequiresDatabasePersistence(GameMode mode)
    {
        return mode == GameMode.VsPlayerOnline;
    }

    /// <summary>
    /// Génère toutes les combinaisons gagnantes possibles pour un plateau width x height.
    /// Règle : Il faut aligner Math.Min(width, height) symboles pour gagner.
    /// </summary>
    /// <param name="width">Largeur du plateau.</param>
    /// <param name="height">Hauteur du plateau.</param>
    /// <returns>Liste des combinaisons gagnantes.</returns>
    private List<int[]> GenerateWinningCombinations(int width, int height)
    {
        List<int[]> combinations = new();
        int winLength = Math.Min(width, height); // Longueur à aligner pour gagner

        // 1. Lignes horizontales (toutes les séquences de winLength dans chaque ligne)
        for (int row = 0; row < height; row++)
        {
            for (int startCol = 0; startCol <= width - winLength; startCol++)
            {
                int[] line = new int[winLength];
                for (int i = 0; i < winLength; i++)
                {
                    line[i] = row * width + startCol + i;
                }
                combinations.Add(line);
            }
        }

        // 2. Colonnes verticales (toutes les séquences de winLength dans chaque colonne)
        for (int col = 0; col < width; col++)
        {
            for (int startRow = 0; startRow <= height - winLength; startRow++)
            {
                int[] column = new int[winLength];
                for (int i = 0; i < winLength; i++)
                {
                    column[i] = (startRow + i) * width + col;
                }
                combinations.Add(column);
            }
        }

        // 3. Diagonales descendantes (\) - toutes les séquences de winLength
        for (int row = 0; row <= height - winLength; row++)
        {
            for (int col = 0; col <= width - winLength; col++)
            {
                int[] diagonal = new int[winLength];
                for (int i = 0; i < winLength; i++)
                {
                    diagonal[i] = (row + i) * width + (col + i);
                }
                combinations.Add(diagonal);
            }
        }

        // 4. Diagonales ascendantes (/) - toutes les séquences de winLength
        for (int row = 0; row <= height - winLength; row++)
        {
            for (int col = winLength - 1; col < width; col++)
            {
                int[] diagonal = new int[winLength];
                for (int i = 0; i < winLength; i++)
                {
                    diagonal[i] = (row + i) * width + (col - i);
                }
                combinations.Add(diagonal);
            }
        }

        return combinations;
    }

    /// <summary>
    /// Crée une nouvelle partie de Tic-Tac-Toe selon le mode choisi.
    /// </summary>
    /// <param name="request">Requête contenant le mode, les joueurs et le symbole choisi.</param>
    /// <returns>La partie créée sous forme de DTO.</returns>
    /// <exception cref="ArgumentNullException">Si la requête est null.</exception>
    /// <exception cref="ArgumentException">Si les données de la requête sont invalides.</exception>
    public async Task<GameDTO> CreateGame(CreateGameRequest request)
    {
        try
        {
            // Validation de la requête
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request), "La requête ne peut pas être null.");
            }

            // 1. Parser le mode et le symbole avec validation
            if (!Enum.TryParse<GameMode>(request.GameMode, out GameMode gameMode))
            {
                throw new ArgumentException($"Mode de jeu invalide : {request.GameMode}");
            }

            // Les parties en ligne doivent être créées via le matchmaking, pas via CreateGame
            if (gameMode == GameMode.VsPlayerOnline)
            {
                throw new ArgumentException("Les parties en ligne doivent être créées via le matchmaking. Utilisez l'endpoint /api/matchmaking/join ou /api/matchmaking/invite.");
            }

            if (!Enum.TryParse<PlayerSymbol>(request.ChosenSymbol, out PlayerSymbol player1Symbol))
            {
                throw new ArgumentException($"Symbole invalide : {request.ChosenSymbol}");
            }

            PlayerSymbol player2Symbol = player1Symbol == PlayerSymbol.X ? PlayerSymbol.O : PlayerSymbol.X;

            // 2. Créer ou récupérer le joueur 1 (celui qui choisit, toujours humain pour VsComputer)
            Player player1 = new Player(request.Player1Name.Trim(), player1Symbol, PlayerType.Human);

            // 3. Créer ou récupérer le joueur 2 selon le mode
            Player player2;
            switch (gameMode)
            {
                case GameMode.VsComputer:
                    // Pour les parties locales, réutiliser EasiBot du cache ou en créer un
                    string easiBotKey = $"EasiBot-{player2Symbol}";
                    if (!_inMemoryPlayers.TryGetValue(Guid.Parse(easiBotKey.GetHashCode().ToString("X").PadLeft(32, '0')), out player2))
                    {
                        player2 = new Player("EasiBot", player2Symbol, PlayerType.Computer);
                        lock (_cacheLock)
                        {
                            _inMemoryPlayers[player2.Id] = player2;
                        }
                    }
                    break;
                case GameMode.VsPlayerLocal:
                    player2 = new Player((request.Player2Name ?? "Joueur 2").Trim(), player2Symbol, PlayerType.Human);
                    break;
                case GameMode.VsPlayerOnline:
                    player2 = new Player((request.Player2Name ?? "Joueur 2").Trim(), player2Symbol, PlayerType.Human);
                    break;
                default:
                    throw new ArgumentException($"Mode de jeu non supporté : {gameMode}");
            }

            // 4. Déterminer les positions X et O
            Player playerX;
            Player playerO;
            if (player1Symbol == PlayerSymbol.X)
            {
                playerX = player1;
                playerO = player2;
            }
            else
            {
                playerX = player2;
                playerO = player1;
            }

            // 5. Créer la partie - X commence
            Game game = new Game(playerX.Id, playerO.Id, gameMode);

            // 6. Enregistrer selon le mode : mémoire (local) ou DB (online)
            if (RequiresDatabasePersistence(gameMode))
            {
                // Parties online → PostgreSQL
                // NOTE: Pour les parties online, playerX.Id et playerO.Id sont des User.Id existants
                // On ne crée PAS de Player entities pour les parties online
                await _dbContext.Games.AddAsync(game);
                await _dbContext.SaveChangesAsync();
            }
            else
            {
                // Parties locales → Cache mémoire
                lock (_cacheLock)
                {
                    _inMemoryPlayers[player1.Id] = player1;
                    _inMemoryPlayers[player2.Id] = player2;
                    _inMemoryGames[game.Id] = game;
                }
            }

            // 7. Faire jouer l'IA si c'est son tour (X commence toujours)
            // Si X est l'ordinateur, il doit jouer en premier
            if (playerX.Type == PlayerType.Computer)
            {
                // Délai de 1200ms avant que l'IA ne joue pour une meilleure UX
                await Task.Delay(1200);
                
                await PlayComputerMove(game, playerX);
                
                if (RequiresDatabasePersistence(gameMode))
                {
                    await _dbContext.SaveChangesAsync();
                }
                else
                {
                    lock (_cacheLock)
                    {
                        _inMemoryGames[game.Id] = game;
                    }
                }
            }

            // 8. Convertir et retourner le DTO
            return GameMapper.ToDTO(game);
        }
        catch (ArgumentNullException ex)
        {
            throw new ArgumentNullException(ex.ParamName, $"Paramètre requis manquant : {ex.Message}");
        }
        catch (ArgumentException ex)
        {
            throw new ArgumentException($"Erreur de validation : {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Erreur lors de la création de la partie : {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Récupère une partie par son identifiant.
    /// </summary>
    /// <param name="gameId">Identifiant de la partie.</param>
    /// <returns>La partie sous forme de DTO.</returns>
    /// <exception cref="KeyNotFoundException">Si la partie n'existe pas.</exception>
    public async Task<GameDTO> GetGame(Guid gameId)
    {
        try
        {
            Console.WriteLine($"🔍 GetGame appelé pour gameId: {gameId}");
            
            // Chercher d'abord en mémoire (parties locales: VsComputer, VsPlayerLocal)
            Game? game;
            lock (_cacheLock)
            {
                _inMemoryGames.TryGetValue(gameId, out game);
            }

            // Si trouvé en mémoire, c'est une partie locale (pas en DB)
            // Les parties locales n'ont pas de User associé, PlayerXName et PlayerOName seront null
            if (game != null)
            {
                Console.WriteLine($"✅ Partie trouvée en mémoire: Mode={game.Mode}, Status={game.Status}");
                Console.WriteLine($"⚠️  Partie locale: PlayerXName et PlayerOName seront null dans le DTO (géré par le frontend)");
                
                return GameMapper.ToDTO(game);
            }

            Console.WriteLine($"🔎 Partie non trouvée en mémoire, recherche en DB...");
            
            // Sinon, chercher en DB (parties online: VsPlayerOnline)
            game = await _dbContext.Games
                .Include(g => g.PlayerX)
                .Include(g => g.PlayerO)
                .FirstOrDefaultAsync(g => g.Id == gameId);
            
            if (game == null)
            {
                Console.WriteLine($"❌ Partie introuvable avec l'ID : {gameId}");
                throw new KeyNotFoundException($"Partie introuvable avec l'ID : {gameId}");
            }
            
            Console.WriteLine($"✅ Partie trouvée en DB: Mode={game.Mode}, Status={game.Status}, PlayerX={game.PlayerX?.Username ?? "null"}, PlayerO={game.PlayerO?.Username ?? "null"}");

            return GameMapper.ToDTO(game);
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Erreur dans GetGame: {ex.Message}");
            throw new InvalidOperationException($"Erreur lors de la récupération de la partie : {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Joue un coup dans une partie existante.
    /// </summary>
    /// <param name="request">Requête contenant l'ID de la partie, du joueur et la position.</param>
    /// <returns>La partie mise à jour sous forme de DTO.</returns>
    /// <exception cref="ArgumentNullException">Si la requête est null.</exception>
    /// <exception cref="KeyNotFoundException">Si la partie ou le joueur n'existe pas.</exception>
    /// <exception cref="InvalidOperationException">Si le coup est invalide.</exception>
    public async Task<GameDTO> MakeMove(MakeMoveRequest request)
    {
        try
        {
            // 1. Validation de la requête
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request), "La requête ne peut pas être null.");
            }

            // 2. Récupérer la partie (mémoire ou DB)
            Game? game;
            bool isInMemory;
            lock (_cacheLock)
            {
                isInMemory = _inMemoryGames.TryGetValue(request.GameId, out game);
            }

            if (!isInMemory)
            {
                game = await _dbContext.Games.FindAsync(request.GameId);
            }

            if (game == null)
            {
                throw new KeyNotFoundException($"Partie introuvable avec l'ID : {request.GameId}");
            }

            // 3. Valider le joueur selon le mode
            PlayerSymbol playerSymbol;
            if (isInMemory)
            {
                // Parties locales : chercher le Player en mémoire
                Player? player;
                lock (_cacheLock)
                {
                    if (!_inMemoryPlayers.TryGetValue(request.PlayerId, out player))
                    {
                        throw new KeyNotFoundException($"Joueur introuvable avec l'ID : {request.PlayerId}");
                    }
                }
                playerSymbol = player.Symbol;
            }
            else
            {
                // Parties online : valider que le playerId correspond à playerXId ou playerOId
                if (request.PlayerId == game.PlayerXId)
                {
                    playerSymbol = PlayerSymbol.X;
                }
                else if (request.PlayerId == game.PlayerOId)
                {
                    playerSymbol = PlayerSymbol.O;
                }
                else
                {
                    throw new KeyNotFoundException($"Le joueur {request.PlayerId} ne participe pas à cette partie.");
                }
            }

            // 4. Vérifier que la partie n'est pas terminée
            if (game.Status != GameStatus.InProgress)
            {
                throw new InvalidOperationException($"La partie est déjà terminée avec le statut : {game.Status}");
            }

            // 5. Vérifier que c'est bien le tour du joueur
            if (playerSymbol != game.CurrentTurn)
            {
                throw new InvalidOperationException($"Ce n'est pas le tour du joueur {playerSymbol}. Tour actuel : {game.CurrentTurn}");
            }

            // 6. Vérifier que la position est valide et libre
            int maxPosition = (game.Width * game.Height) - 1;
            if (request.Position < 0 || request.Position > maxPosition)
            {
                throw new ArgumentException($"Position invalide : {request.Position}. Doit être entre 0 et {maxPosition}.");
            }

            if (game.Board[request.Position] != null)
            {
                throw new InvalidOperationException($"La position {request.Position} est déjà occupée.");
            }

            // 7. Placer le symbole sur le plateau
            game.Board[request.Position] = playerSymbol;

            // 8. Vérifier s'il y a un gagnant
            var winningLine = CheckWinner(game, playerSymbol);
            if (winningLine != null)
            {
                game.Status = playerSymbol == PlayerSymbol.X ? GameStatus.XWins : GameStatus.OWins;
                game.WinnerId = request.PlayerId;
                // Suppression de WinningLine
            }
            // 9. Vérifier s'il y a match nul
            else if (IsBoardFull(game))
            {
                game.Status = GameStatus.Draw;
            }
            // 10. Changer de tour
            else
            {
                game.CurrentTurn = game.CurrentTurn == PlayerSymbol.X ? PlayerSymbol.O : PlayerSymbol.X;
            }

            // 11. Sauvegarder les modifications
            if (isInMemory)
            {
                lock (_cacheLock)
                {
                    _inMemoryGames[game.Id] = game;
                }
            }
            else
            {
                await _dbContext.SaveChangesAsync();
            }

            var gameDto = GameMapper.ToDTO(game);

            // Retourner le DTO (SignalR sera géré par le contrôleur)
            return gameDto;
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (ArgumentException)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Erreur lors du coup : {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Joue automatiquement le coup de l'ordinateur si c'est son tour.
    /// </summary>
    public async Task<GameDTO> PlayAiMoveIfNeeded(Guid gameId)
    {
        try
        {
            // Récupérer la partie (mémoire ou DB)
            Game? game;
            bool isInMemory;
            lock (_cacheLock)
            {
                isInMemory = _inMemoryGames.TryGetValue(gameId, out game);
            }

            if (!isInMemory)
            {
                game = await _dbContext.Games.FindAsync(gameId);
            }

            if (game == null)
            {
                throw new KeyNotFoundException($"Partie introuvable avec l'ID : {gameId}");
            }

            // Si la partie est terminée, ne rien faire
            if (game.Status != GameStatus.InProgress)
            {
                return GameMapper.ToDTO(game);
            }

            // Si la partie est locale (VsComputer) et c'est au tour de l'IA, jouer automatiquement
            if (!RequiresDatabasePersistence(game.Mode))
            {
                // Trouver le joueur IA (PlayerType.Computer) parmi les deux joueurs
                Player? aiPlayer = null;
                lock (_cacheLock)
                {
                    if (_inMemoryPlayers.TryGetValue(game.PlayerXId, out var px) && px.Type == PlayerType.Computer)
                        aiPlayer = px;
                    else if (_inMemoryPlayers.TryGetValue(game.PlayerOId, out var po) && po.Type == PlayerType.Computer)
                        aiPlayer = po;
                }
                if (aiPlayer != null && game.CurrentTurn == aiPlayer.Symbol && game.Status == GameStatus.InProgress)
                {
                    await PlayComputerMove(game, aiPlayer);
                    lock (_cacheLock)
                    {
                        _inMemoryGames[game.Id] = game;
                    }
                }
            }
            return GameMapper.ToDTO(game);
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Erreur lors du coup de l'IA : {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Vérifie si un joueur a gagné la partie et retourne la ligne gagnante.
    /// </summary>
    /// <param name="game">La partie à vérifier.</param>
    /// <param name="symbol">Le symbole du joueur.</param>
    /// <returns>La ligne gagnante (tableau de 3 positions) ou null si pas de victoire.</returns>
    private int[]? CheckWinner(Game game, PlayerSymbol symbol)
    {
        // Générer les combinaisons gagnantes pour les dimensions du plateau
        List<int[]> winningCombinations = GenerateWinningCombinations(game.Width, game.Height);

        // Vérifier chaque combinaison
        foreach (int[] combination in winningCombinations)
        {
            bool isWinning = true;
            for (int i = 0; i < combination.Length; i++)
            {
                if (game.Board[combination[i]] != symbol)
                {
                    isWinning = false;
                    break;
                }
            }

            if (isWinning)
            {
                return combination;
            }
        }

        return null;
    }

    /// <summary>
    /// Vérifie si le plateau est complètement rempli.
    /// </summary>
    /// <param name="game">La partie à vérifier.</param>
    /// <returns>True si toutes les cases sont occupées, False sinon.</returns>
    private bool IsBoardFull(Game game)
    {
        // Vérifier si toutes les cases sont non-null
        return game.Board.All(cell => cell != null);
    }

    /// <summary>
    /// Fait jouer l'ordinateur automatiquement en choisissant une case libre aléatoirement.
    /// </summary>
    /// <param name="game">La partie en cours.</param>
    /// <param name="computerPlayer">Le joueur ordinateur.</param>
    private async Task PlayComputerMove(Game game, Player computerPlayer)
    {
        // 1. Trouver toutes les positions libres
        List<int> emptyPositions = new();
        for (int i = 0; i < game.Board.Length; i++)
        {
            if (game.Board[i] == null)
            {
                emptyPositions.Add(i);
            }
        }

        // 2. Si aucune position libre, ne rien faire (ne devrait pas arriver)
        if (emptyPositions.Count == 0)
        {
            return;
        }

        // 3. Choisir une position aléatoire
        Random random = new();
        int randomIndex = random.Next(emptyPositions.Count);
        int chosenPosition = emptyPositions[randomIndex];

        // 4. Placer le symbole
        game.Board[chosenPosition] = computerPlayer.Symbol;

        // 5. Vérifier s'il y a un gagnant
        var winningLine = CheckWinner(game, computerPlayer.Symbol);
        if (winningLine != null)
        {
            game.Status = computerPlayer.Symbol == PlayerSymbol.X ? GameStatus.XWins : GameStatus.OWins;
            game.WinnerId = computerPlayer.Id;
        }
        // 6. Vérifier s'il y a match nul
        else if (IsBoardFull(game))
        {
            game.Status = GameStatus.Draw;
        }
        // 7. Changer de tour
        else
        {
            game.CurrentTurn = game.CurrentTurn == PlayerSymbol.X ? PlayerSymbol.O : PlayerSymbol.X;
        }
    }

    /// <summary>
    /// Récupère l'historique des parties d'un utilisateur.
    /// </summary>
    public async Task<List<GameHistoryDTO>> GetUserGameHistory(Guid userId, int limit = 20)
    {
        var games = await _dbContext.Games
            .Include(g => g.PlayerX)
            .Include(g => g.PlayerO)
            .Where(g => g.PlayerXId == userId || g.PlayerOId == userId)
            .OrderByDescending(g => g.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return games.Select(g =>
        {
            var isPlayerX = g.PlayerXId == userId;
            var opponent = isPlayerX ? g.PlayerO : g.PlayerX;

            return new GameHistoryDTO
            {
                Id = g.Id,
                Mode = g.Mode.ToString(),
                Status = g.Status.ToString(),
                IsWinner = g.WinnerId == userId,
                PlayerSymbol = isPlayerX ? "X" : "O",
                OpponentName = opponent?.Username,
                CreatedAt = g.CreatedAt
            };
        }).ToList();
    }

    /// <summary>
    /// Récupère les statistiques d'un utilisateur.
    /// </summary>
    public async Task<UserStatsDTO> GetUserStats(Guid userId)
    {
        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
        {
            throw new KeyNotFoundException("Utilisateur non trouvé");
        }

        var games = await _dbContext.Games
            .Where(g => g.PlayerXId == userId || g.PlayerOId == userId)
            .Where(g => g.Status != GameStatus.InProgress)
            .ToListAsync();

        var totalGames = games.Count;
        var wins = games.Count(g => g.WinnerId == userId);
        var losses = games.Count(g => g.WinnerId != null && g.WinnerId != userId);
        var draws = games.Count(g => g.Status == GameStatus.Draw);
        var winRate = totalGames > 0 ? (double)wins / totalGames : 0.0;
        var lastGameAt = games.Any() ? games.Max(g => g.CreatedAt) : (DateTime?)null;

        return new UserStatsDTO
        {
            UserId = userId,
            Username = user.Username,
            TotalGames = totalGames,
            Wins = wins,
            Losses = losses,
            Draws = draws,
            WinRate = winRate,
            LastGameAt = lastGameAt
        };
    }
}
