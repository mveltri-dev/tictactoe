using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Collections.Concurrent;
using Api.Hubs;
using Infrastructure.Database;
using Domain.Entities;
using Domain.Enums;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MatchmakingController : ControllerBase
{
    private readonly TicTacToeDbContext _context;
    private readonly IHubContext<GameHub> _hubContext;
    private static readonly ConcurrentQueue<MatchmakingEntry> _matchmakingQueue = new();
    private static readonly ConcurrentDictionary<Guid, MatchmakingEntry> _activeSearches = new();

    public MatchmakingController(TicTacToeDbContext context, IHubContext<GameHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    [HttpPost("join")]
    public async Task<IActionResult> JoinMatchmaking()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userGuid = Guid.Parse(userId);

        // Vérifier si l'utilisateur est déjà en recherche
        if (_activeSearches.ContainsKey(userGuid))
        {
            return BadRequest(new { message = "Vous êtes déjà en recherche de partie" });
        }

        var user = await _context.Users.FindAsync(userGuid);
        if (user == null)
        {
            return NotFound("Utilisateur introuvable");
        }

        var entry = new MatchmakingEntry
        {
            UserId = userGuid,
            Username = user.Username,
            JoinedAt = DateTime.UtcNow
        };

        // Chercher un adversaire dans la file
        MatchmakingEntry? opponent = null;
        while (_matchmakingQueue.TryDequeue(out var potentialOpponent))
        {
            // Vérifier que l'adversaire est toujours actif
            if (_activeSearches.ContainsKey(potentialOpponent.UserId))
            {
                opponent = potentialOpponent;
                break;
            }
            // Sinon, continuer à chercher dans la queue
        }

        if (opponent != null)
        {
            // Supprimer l'adversaire de la recherche active
            _activeSearches.TryRemove(opponent.UserId, out _);

            // Créer une partie
            var game = new Game(userGuid, opponent.UserId, GameMode.VsPlayerOnline);
            _context.Games.Add(game);
            await _context.SaveChangesAsync();

            // Notifier les deux joueurs via SignalR
            await _hubContext.Clients.Group($"user_{userGuid}").SendAsync("MatchFound", new
            {
                gameId = game.Id,
                opponentId = opponent.UserId,
                opponentUsername = opponent.Username,
                yourSymbol = "X",
                opponentSymbol = "O"
            });

            await _hubContext.Clients.Group($"user_{opponent.UserId}").SendAsync("MatchFound", new
            {
                gameId = game.Id,
                opponentId = userGuid,
                opponentUsername = user.Username,
                yourSymbol = "O",
                opponentSymbol = "X"
            });

            return Ok(new
            {
                gameId = game.Id,
                opponentId = opponent.UserId,
                opponentUsername = opponent.Username,
                yourSymbol = "X",
                message = "Match trouvé !"
            });
        }

        // Aucun adversaire disponible, ajouter à la file
        _activeSearches.TryAdd(userGuid, entry);
        _matchmakingQueue.Enqueue(entry);

        return Ok(new { message = "En attente d'un adversaire...", status = "searching" });
    }

    [HttpPost("leave")]
    public IActionResult LeaveMatchmaking()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userGuid = Guid.Parse(userId);

        if (_activeSearches.TryRemove(userGuid, out var entry))
        {
            // Note: On ne peut pas facilement retirer de ConcurrentQueue
            // mais ce n'est pas grave, on vérifie l'existence dans activeSearches
            return Ok(new { message = "Recherche annulée" });
        }

        return Ok(new { message = "Aucune recherche active" });
    }

    [HttpGet("status")]
    public IActionResult GetMatchmakingStatus()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userGuid = Guid.Parse(userId);

        if (_activeSearches.ContainsKey(userGuid))
        {
            return Ok(new
            {
                isSearching = true,
                playersInQueue = _activeSearches.Count
            });
        }

        return Ok(new
        {
            isSearching = false,
            playersInQueue = _activeSearches.Count
        });
    }

    [HttpPost("invite/{friendId}")]
    public async Task<IActionResult> InviteFriend(string friendId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (!Guid.TryParse(friendId, out var friendGuid))
        {
            return BadRequest("Invalid friend ID");
        }

        var userGuid = Guid.Parse(userId);

        // Vérifier que l'ami existe
        var friend = await _context.Users.FindAsync(friendGuid);
        if (friend == null)
        {
            return NotFound("Ami introuvable");
        }

        // Vérifier qu'ils sont amis
        var areFriends = await _context.Friendships
            .AnyAsync(f => f.Status == FriendshipStatus.Accepted &&
                          ((f.RequesterId == userGuid && f.ReceiverId == friendGuid) ||
                           (f.RequesterId == friendGuid && f.ReceiverId == userGuid)));

        if (!areFriends)
        {
            return BadRequest("Vous devez être amis pour l'inviter");
        }

        var user = await _context.Users.FindAsync(userGuid);
        if (user == null)
        {
            return NotFound("Utilisateur introuvable");
        }

        // Créer une partie
        var game = new Game(userGuid, friendGuid, GameMode.VsPlayerOnline);
        _context.Games.Add(game);
        await _context.SaveChangesAsync();

        // Notifier l'ami via SignalR
        Console.WriteLine($"[SignalR] Envoi GameInvitation au groupe: user_{friendGuid}");
        await _hubContext.Clients.Group($"user_{friendGuid}").SendAsync("GameInvitation", new
        {
            gameId = game.Id,
            inviterId = userGuid,
            inviterUsername = user.Username,
            yourSymbol = "O",
            inviterSymbol = "X"
        });
        Console.WriteLine($"[SignalR] GameInvitation envoyée avec succès");

        return Ok(new
        {
            gameId = game.Id,
            message = "Invitation envoyée"
        });
    }

    [HttpGet("invitations")]
    public async Task<IActionResult> GetPendingInvitations()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userGuid = Guid.Parse(userId);

        // Récupérer les parties où l'utilisateur est PlayerO (invité) et l'invitation n'a pas encore été acceptée
        var pendingGames = await _context.Games
            .Include(g => g.PlayerX)
            .Where(g => g.PlayerOId == userGuid && 
                       g.Status == GameStatus.InProgress &&
                       g.Mode == GameMode.VsPlayerOnline &&
                       !g.IsInvitationAccepted) // Filtrer les invitations non acceptées
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new
            {
                gameId = g.Id,
                inviterId = g.PlayerXId,
                inviterUsername = g.PlayerX!.Username,
                invitedAt = g.CreatedAt
            })
            .ToListAsync();

        return Ok(pendingGames);
    }

    [HttpGet("active-games")]
    public async Task<IActionResult> GetActiveGames()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userGuid = Guid.Parse(userId);

        // Récupérer toutes les parties InProgress où l'utilisateur est joueur
        // ET où l'invitation a été acceptée (IsInvitationAccepted = true)
        var activeGames = await _context.Games
            .Include(g => g.PlayerX)
            .Include(g => g.PlayerO)
            .Where(g => (g.PlayerXId == userGuid || g.PlayerOId == userGuid) && 
                       g.Status == GameStatus.InProgress &&
                       g.Mode == GameMode.VsPlayerOnline &&
                       g.IsInvitationAccepted) // Invitation acceptée = partie active
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new
            {
                gameId = g.Id,
                opponentName = g.PlayerXId == userGuid ? g.PlayerO!.Username : g.PlayerX!.Username,
                opponentId = g.PlayerXId == userGuid ? g.PlayerOId : g.PlayerXId
            })
            .ToListAsync();

        return Ok(activeGames);
    }

    [HttpGet("sent-invitations")]
    public async Task<IActionResult> GetSentInvitations()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userGuid = Guid.Parse(userId);

        // Récupérer les parties où l'utilisateur est PlayerX (inviteur) et l'invitation n'a pas encore été acceptée
        var sentGames = await _context.Games
            .Include(g => g.PlayerO)
            .Where(g => g.PlayerXId == userGuid && 
                       g.Status == GameStatus.InProgress &&
                       g.Mode == GameMode.VsPlayerOnline &&
                       !g.IsInvitationAccepted) // Filtrer les invitations non acceptées
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new
            {
                gameId = g.Id,
                inviteeId = g.PlayerOId,
                inviteeUsername = g.PlayerO!.Username,
                invitedAt = g.CreatedAt
            })
            .ToListAsync();

        return Ok(sentGames);
    }

    [HttpDelete("invitations/{gameId}")]
    public async Task<IActionResult> DeclineInvitation(string gameId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (!Guid.TryParse(gameId, out var gameGuid))
        {
            return BadRequest("Invalid game ID");
        }

        var userGuid = Guid.Parse(userId);

        // Récupérer la partie
        var game = await _context.Games
            .Include(g => g.PlayerX)
            .Include(g => g.PlayerO)
            .FirstOrDefaultAsync(g => g.Id == gameGuid);

        if (game == null)
        {
            return NotFound("Partie introuvable");
        }

        // Vérifier que l'utilisateur est bien l'invité (PlayerO)
        if (game.PlayerOId != userGuid)
        {
            return BadRequest("Vous n'êtes pas l'invité de cette partie");
        }

        // Supprimer la partie
        _context.Games.Remove(game);
        await _context.SaveChangesAsync();

        // Notifier l'inviteur via SignalR
        await _hubContext.Clients.Group($"user_{game.PlayerXId}").SendAsync("InvitationDeclined", new
        {
            gameId = game.Id,
            declinerUsername = game.PlayerO!.Username
        });

        return Ok(new { message = "Invitation refusée" });
    }

    [HttpPost("invitations/{gameId}/accept")]
    public async Task<IActionResult> AcceptInvitation(string gameId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        if (!Guid.TryParse(gameId, out var gameGuid))
        {
            return BadRequest("Invalid game ID");
        }

        var userGuid = Guid.Parse(userId);

        // Récupérer la partie
        var game = await _context.Games
            .Include(g => g.PlayerX)
            .Include(g => g.PlayerO)
            .FirstOrDefaultAsync(g => g.Id == gameGuid);

        if (game == null)
        {
            return NotFound("Partie introuvable");
        }

        // Vérifier que l'utilisateur est bien l'invité (PlayerO)
        if (game.PlayerOId != userGuid)
        {
            return BadRequest("Vous n'êtes pas l'invité de cette partie");
        }

        // Marquer l'invitation comme acceptée
        game.IsInvitationAccepted = true;
        await _context.SaveChangesAsync();

        // Notifier l'inviteur via SignalR que l'invitation a été acceptée
        Console.WriteLine($"[SignalR] Envoi InvitationAccepted au groupe: user_{game.PlayerXId}");
        await _hubContext.Clients.Group($"user_{game.PlayerXId}").SendAsync("InvitationAccepted", new
        {
            gameId = game.Id,
            accepterUsername = game.PlayerO!.Username,
            accepterId = userGuid
        });
        Console.WriteLine($"[SignalR] InvitationAccepted envoyée avec succès");

        return Ok(new { 
            message = "Invitation acceptée",
            gameId = game.Id
        });
    }
}

public class MatchmakingEntry
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
}
