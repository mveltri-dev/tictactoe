using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Infrastructure.Services;
using Application.DTOs.Requests;
using Application.DTOs.Responses;
using System.Security.Claims;
using Api.Hubs;

namespace Api.Controllers;

/// <summary>
/// Contrôleur gérant les opérations liées aux parties de Tic-Tac-Toe.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    private readonly GameService _gameService;
    private readonly IHubContext<GameHub> _hubContext;

    /// <summary>
    /// Constructeur avec injection de dépendance.
    /// </summary>
    /// <param name="gameService">Service de gestion des parties.</param>
    /// <param name="hubContext">Hub SignalR pour les notifications temps réel.</param>
    public GameController(GameService gameService, IHubContext<GameHub> hubContext)
    {
        _gameService = gameService;
        _hubContext = hubContext;
    }

    /// <summary>
    /// Crée une nouvelle partie de Tic-Tac-Toe.
    /// </summary>
    /// <param name="request">Requête contenant les informations de la partie.</param>
    /// <returns>La partie créée.</returns>
    /// <response code="200">Partie créée avec succès.</response>
    /// <response code="400">Requête invalide.</response>
    [HttpPost]
    [ProducesResponseType(typeof(GameDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateGame([FromBody] CreateGameRequest request)
    {
        try
        {
            // Valider le ModelState (Data Annotations)
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Créer la partie via le service
            GameDTO game = await _gameService.CreateGame(request);

            // Retourner 200 OK avec le DTO
            return Ok(game);
        }
        catch (ArgumentNullException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }

    /// <summary>
    /// Récupère une partie existante par son identifiant.
    /// </summary>
    /// <param name="id">Identifiant unique de la partie.</param>
    /// <returns>Les détails de la partie.</returns>
    /// <response code="200">Partie trouvée.</response>
    /// <response code="404">Partie introuvable.</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(GameDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGame(Guid id)
    {
        try
        {
            // Récupérer la partie via le service
            GameDTO game = await _gameService.GetGame(id);

            // Retourner 200 OK avec le DTO
            return Ok(game);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }

    /// <summary>
    /// Joue un coup dans une partie existante.
    /// </summary>
    /// <param name="id">Identifiant de la partie.</param>
    /// <param name="request">Requête contenant le coup à jouer.</param>
    /// <returns>L'état mis à jour de la partie.</returns>
    /// <response code="200">Coup joué avec succès.</response>
    /// <response code="400">Coup invalide.</response>
    /// <response code="404">Partie ou joueur introuvable.</response>
    [HttpPost("{id}/moves")]
    [ProducesResponseType(typeof(GameDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MakeMove(Guid id, [FromBody] MakeMoveRequest request)
    {
        try
        {
            // Valider le ModelState
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // S'assurer que l'ID de la route correspond à l'ID de la requête
            if (id != request.GameId)
            {
                return BadRequest(new { error = "L'ID de la partie dans l'URL ne correspond pas à celui dans la requête." });
            }

            // Jouer le coup via le service
            GameDTO game = await _gameService.MakeMove(request);

            // Envoyer la mise à jour via SignalR pour les parties online
            if (game.Mode == "VsPlayerOnline")
            {
                await _hubContext.Clients.Groups($"user_{game.PlayerXId}", $"user_{game.PlayerOId}")
                    .SendAsync("GameUpdated", game);
            }

            // Retourner 200 OK avec le DTO mis à jour
            return Ok(game);
        }
        catch (ArgumentNullException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }

    /// <summary>
    /// Joue automatiquement le coup de l'IA si c'est son tour.
    /// </summary>
    [HttpPost("{id}/ai-move")]
    [ProducesResponseType(typeof(GameDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PlayAiMove(Guid id)
    {
        try
        {
            GameDTO game = await _gameService.PlayAiMoveIfNeeded(id);
            return Ok(game);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }

    /// <summary>
    /// Récupère l'historique des parties de l'utilisateur connecté.
    /// </summary>
    /// <param name="limit">Nombre maximum de parties à retourner (défaut: 20).</param>
    /// <returns>Liste des parties jouées par l'utilisateur.</returns>
    /// <response code="200">Historique récupéré avec succès.</response>
    /// <response code="401">Non authentifié.</response>
    [HttpGet("history")]
    [Authorize]
    [ProducesResponseType(typeof(List<GameHistoryDTO>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetUserHistory([FromQuery] int limit = 20)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? throw new UnauthorizedAccessException("User ID non trouvé"));

            var history = await _gameService.GetUserGameHistory(userId, limit);
            return Ok(history);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }

    /// <summary>
    /// Récupère les statistiques de l'utilisateur connecté.
    /// </summary>
    /// <returns>Statistiques de l'utilisateur.</returns>
    /// <response code="200">Statistiques récupérées avec succès.</response>
    /// <response code="401">Non authentifié.</response>
    [HttpGet("stats")]
    [Authorize]
    [ProducesResponseType(typeof(UserStatsDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetUserStats()
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? throw new UnauthorizedAccessException("User ID non trouvé"));

            var stats = await _gameService.GetUserStats(userId);
            return Ok(stats);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }
}
