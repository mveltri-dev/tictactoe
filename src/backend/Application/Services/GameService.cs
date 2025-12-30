using Domain.Entities;
using Domain.Enums;
using Application.DTOs.Requests;
using Application.DTOs.Responses;
using Application.Mappers;

namespace Application.Services;

/// <summary>
/// Service gérant la logique métier des parties de Tic-Tac-Toe.
/// </summary>
public class GameService
{
    // Stockage en mémoire des parties (sans base de données pour l'instant)
    private readonly Dictionary<Guid, Game> _games = new();
    
    // Stockage en mémoire des joueurs
    private readonly Dictionary<Guid, Player> _players = new();

    /// <summary>
    /// Les 8 combinaisons possibles pour gagner au Tic-Tac-Toe.
    /// </summary>
    private static readonly int[][] WinningCombinations = 
    [
        [0, 1, 2], // Ligne du haut
        [3, 4, 5], // Ligne du milieu
        [6, 7, 8], // Ligne du bas
        [0, 3, 6], // Colonne gauche
        [1, 4, 7], // Colonne centre
        [2, 5, 8], // Colonne droite
        [0, 4, 8], // Diagonale \
        [2, 4, 6]  // Diagonale /
    ];

    /// <summary>
    /// Crée une nouvelle partie de Tic-Tac-Toe selon le mode choisi.
    /// </summary>
    /// <param name="request">Requête contenant le mode, les joueurs et le symbole choisi.</param>
    /// <returns>La partie créée sous forme de DTO.</returns>
    /// <exception cref="ArgumentNullException">Si la requête est null.</exception>
    /// <exception cref="ArgumentException">Si les données de la requête sont invalides.</exception>
    public GameDTO CreateGame(CreateGameRequest request)
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

            if (!Enum.TryParse<PlayerSymbol>(request.ChosenSymbol, out PlayerSymbol player1Symbol))
            {
                throw new ArgumentException($"Symbole invalide : {request.ChosenSymbol}");
            }

            PlayerSymbol player2Symbol = player1Symbol == PlayerSymbol.X ? PlayerSymbol.O : PlayerSymbol.X;

            // 2. Créer le joueur 1 (celui qui choisit, toujours humain)
            Player player1 = new Player(request.Player1Name.Trim(), player1Symbol, PlayerType.Human);

            // 3. Créer le joueur 2 selon le mode
            Player player2;
            switch (gameMode)
            {
                case GameMode.VsComputer:
                    player2 = new Player("EasiBot", player2Symbol, PlayerType.Computer);
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

            // 6. Sauvegarder en mémoire
            _players[player1.Id] = player1;
            _players[player2.Id] = player2;
            _games[game.Id] = game;

            // 7. Convertir et retourner le DTO
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
}
