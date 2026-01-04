using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Infrastructure.Database;
using Domain.Entities;
using Domain.Enums;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FriendsController : ControllerBase
{
    private readonly TicTacToeDbContext _context;

    public FriendsController(TicTacToeDbContext context)
    {
        _context = context;
    }

    // Récupère la liste des amis (friendships acceptées)
    [HttpGet]
    public async Task<IActionResult> GetFriends()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userGuid = Guid.Parse(userId);
        
        // Récupère toutes les amitiés acceptées où l'utilisateur est soit requester soit receiver
        var friendships = await _context.Friendships
            .Include(f => f.Requester)
            .Include(f => f.Receiver)
            .Where(f => f.Status == FriendshipStatus.Accepted && 
                       (f.RequesterId == userGuid || f.ReceiverId == userGuid))
            .ToListAsync();
        
        var friends = new List<object>();
        
        foreach (var friendship in friendships)
        {
            // Détermine qui est l'ami (l'autre personne dans la relation)
            var friend = friendship.RequesterId == userGuid ? friendship.Receiver : friendship.Requester;
            
            var games = await _context.Games
                .Where(g => g.PlayerXId == friend.Id || g.PlayerOId == friend.Id)
                .ToListAsync();
            
            var wins = games.Count(g => 
                (g.PlayerXId == friend.Id && g.Status == GameStatus.XWins) ||
                (g.PlayerOId == friend.Id && g.Status == GameStatus.OWins)
            );
            var losses = games.Count(g => 
                (g.PlayerXId == friend.Id && g.Status == GameStatus.OWins) ||
                (g.PlayerOId == friend.Id && g.Status == GameStatus.XWins)
            );
            var draws = games.Count(g => g.Status == GameStatus.Draw);
            var score = Math.Max(0, (wins * 3) + draws - losses);
            var winRate = games.Count > 0 ? (double)wins / games.Count * 100 : 0;
            
            friends.Add(new
            {
                id = friend.Id,
                username = friend.Username,
                avatar = "👤",
                status = "offline", // TODO: Implémenter le statut en temps réel avec SignalR
                score,
                wins,
                losses,
                draws,
                gamesPlayed = games.Count,
                winRate,
                rank = 0 // Will be calculated client-side
            });
        }
        
        return Ok(friends);
    }

    // Récupère les demandes d'amis en attente (reçues par l'utilisateur)
    [HttpGet("requests")]
    public async Task<IActionResult> GetFriendRequests()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userGuid = Guid.Parse(userId);
        
        var requests = await _context.Friendships
            .Include(f => f.Requester)
            .Where(f => f.ReceiverId == userGuid && f.Status == FriendshipStatus.Pending)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
        
        var result = requests.Select(r => new
        {
            id = r.Id,
            requesterId = r.RequesterId,
            username = r.Requester.Username,
            avatar = "👤",
            createdAt = r.CreatedAt
        });
        
        return Ok(result);
    }

    // Cherche des utilisateurs pour les ajouter comme amis
    [HttpGet("search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string query)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userGuid = Guid.Parse(userId);
        
        // Récupère les IDs des utilisateurs avec qui il y a déjà une relation (amis ou demande en attente)
        var existingRelationships = await _context.Friendships
            .Where(f => (f.RequesterId == userGuid || f.ReceiverId == userGuid) &&
                       f.Status != FriendshipStatus.Rejected)
            .Select(f => f.RequesterId == userGuid ? f.ReceiverId : f.RequesterId)
            .ToListAsync();
        
        var users = await _context.Users
            .Where(u => u.Id != userGuid && 
                       u.Username.Contains(query) &&
                       !existingRelationships.Contains(u.Id))
            .Take(10)
            .ToListAsync();
        
        var results = users.Select(user => new
        {
            id = user.Id,
            username = user.Username,
            avatar = "👤",
            status = "offline"
        });
        
        return Ok(results);
    }

    // Envoie une demande d'ami
    [HttpPost("{userId}")]
    public async Task<IActionResult> SendFriendRequest(string userId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized();
        }

        if (!Guid.TryParse(userId, out var targetUserGuid))
        {
            return BadRequest("Invalid user ID");
        }

        var currentUserGuid = Guid.Parse(currentUserId);

        // Vérifie que l'utilisateur cible existe
        var targetUser = await _context.Users.FindAsync(targetUserGuid);
        if (targetUser == null)
        {
            return NotFound("Utilisateur introuvable");
        }

        // Vérifie qu'il n'y a pas déjà une relation existante
        var existingFriendship = await _context.Friendships
            .FirstOrDefaultAsync(f => 
                (f.RequesterId == currentUserGuid && f.ReceiverId == targetUserGuid) ||
                (f.RequesterId == targetUserGuid && f.ReceiverId == currentUserGuid));

        if (existingFriendship != null)
        {
            if (existingFriendship.Status == FriendshipStatus.Pending)
            {
                return BadRequest("Une demande d'ami est déjà en attente");
            }
            if (existingFriendship.Status == FriendshipStatus.Accepted)
            {
                return BadRequest("Vous êtes déjà amis");
            }
        }

        // Crée la nouvelle demande d'ami
        var friendship = new Friendship(currentUserGuid, targetUserGuid);
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Demande d'ami envoyée", friendshipId = friendship.Id });
    }

    // Accepte une demande d'ami
    [HttpPut("{friendshipId}/accept")]
    public async Task<IActionResult> AcceptFriendRequest(int friendshipId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userGuid = Guid.Parse(userId);

        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Id == friendshipId && f.ReceiverId == userGuid);

        if (friendship == null)
        {
            return NotFound("Demande d'ami introuvable");
        }

        try
        {
            friendship.Accept();
            await _context.SaveChangesAsync();
            return Ok(new { message = "Demande d'ami acceptée" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // Refuse une demande d'ami
    [HttpPut("{friendshipId}/reject")]
    public async Task<IActionResult> RejectFriendRequest(int friendshipId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userGuid = Guid.Parse(userId);

        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Id == friendshipId && f.ReceiverId == userGuid);

        if (friendship == null)
        {
            return NotFound("Demande d'ami introuvable");
        }

        try
        {
            friendship.Reject();
            await _context.SaveChangesAsync();
            return Ok(new { message = "Demande d'ami refusée" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // Supprime un ami (ou annule une demande)
    [HttpDelete("{friendshipId}")]
    public async Task<IActionResult> RemoveFriend(int friendshipId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userGuid = Guid.Parse(userId);

        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Id == friendshipId && 
                                    (f.RequesterId == userGuid || f.ReceiverId == userGuid));

        if (friendship == null)
        {
            return NotFound("Amitié introuvable");
        }

        _context.Friendships.Remove(friendship);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Ami supprimé" });
    }

    // Récupère les statistiques détaillées d'un ami
    [HttpGet("{friendId}/stats")]
    public async Task<IActionResult> GetFriendStats(string friendId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userGuid = Guid.Parse(userId);

        if (!Guid.TryParse(friendId, out var friendGuid))
        {
            return BadRequest("Invalid friend ID");
        }

        // Vérifie qu'ils sont amis
        var areFriends = await _context.Friendships
            .AnyAsync(f => f.Status == FriendshipStatus.Accepted &&
                          ((f.RequesterId == userGuid && f.ReceiverId == friendGuid) ||
                           (f.RequesterId == friendGuid && f.ReceiverId == userGuid)));

        if (!areFriends)
        {
            return Forbid("Vous devez être amis pour voir ces statistiques");
        }

        var friend = await _context.Users.FindAsync(friendGuid);
        if (friend == null)
        {
            return NotFound();
        }

        var games = await _context.Games
            .Where(g => g.PlayerXId == friendGuid || g.PlayerOId == friendGuid)
            .ToListAsync();

        var gamesPlayed = games.Count;
        var wins = games.Count(g => 
            (g.PlayerXId == friendGuid && g.Status == GameStatus.XWins) ||
            (g.PlayerOId == friendGuid && g.Status == GameStatus.OWins)
        );
        var losses = games.Count(g => 
            (g.PlayerXId == friendGuid && g.Status == GameStatus.OWins) ||
            (g.PlayerOId == friendGuid && g.Status == GameStatus.XWins)
        );
        var draws = games.Count(g => g.Status == GameStatus.Draw);
        var score = (wins * 3) + draws - losses;
        var winRate = gamesPlayed > 0 ? (double)wins / gamesPlayed * 100 : 0;

        // Calcul du rang
        var allUsersWithGames = await _context.Users
            .Select(u => new
            {
                u.Id,
                Games = _context.Games.Count(g => g.PlayerXId == u.Id || g.PlayerOId == u.Id)
            })
            .Where(u => u.Games > 0)
            .ToListAsync();

        var userScores = new List<(Guid Id, int Score)>();
        foreach (var u in allUsersWithGames)
        {
            var userGames = await _context.Games
                .Where(g => g.PlayerXId == u.Id || g.PlayerOId == u.Id)
                .ToListAsync();

            var userWins = userGames.Count(g => 
                (g.PlayerXId == u.Id && g.Status == GameStatus.XWins) ||
                (g.PlayerOId == u.Id && g.Status == GameStatus.OWins)
            );
            var userLosses = userGames.Count(g => 
                (g.PlayerXId == u.Id && g.Status == GameStatus.OWins) ||
                (g.PlayerOId == u.Id && g.Status == GameStatus.XWins)
            );
            var userDraws = userGames.Count(g => g.Status == GameStatus.Draw);
            var userScore = Math.Max(0, (userWins * 3) + userDraws - userLosses);
            
            userScores.Add((u.Id, userScore));
        }

        var sortedScores = userScores.OrderByDescending(x => x.Score).ToList();
        var rank = sortedScores.FindIndex(x => x.Id == friendGuid) + 1;

        return Ok(new
        {
            id = friend.Id,
            username = friend.Username,
            avatar = "👤",
            status = "offline",
            score,
            wins,
            losses,
            draws,
            gamesPlayed,
            winRate,
            rank
        });
    }
}
