using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Infrastructure.Database;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly TicTacToeDbContext _context;

    public UserController(TicTacToeDbContext context)
    {
        _context = context;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(Guid.Parse(userId));
        if (user == null)
        {
            return NotFound();
        }

        return Ok(new
        {
            id = user.Id,
            username = user.Username,
            email = user.Email
        });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var userGuid = Guid.Parse(userId);
        var games = await _context.Games
            .Where(g => (g.PlayerXId == userGuid || g.PlayerOId == userGuid) && 
                       (g.Status == Domain.Enums.GameStatus.XWins || 
                        g.Status == Domain.Enums.GameStatus.OWins || 
                        g.Status == Domain.Enums.GameStatus.Draw))
            .ToListAsync();

        var gamesPlayed = games.Count;
        var wins = games.Count(g => 
            (g.PlayerXId == userGuid && g.Status == Domain.Enums.GameStatus.XWins) ||
            (g.PlayerOId == userGuid && g.Status == Domain.Enums.GameStatus.OWins)
        );
        var losses = games.Count(g => 
            (g.PlayerXId == userGuid && g.Status == Domain.Enums.GameStatus.OWins) ||
            (g.PlayerOId == userGuid && g.Status == Domain.Enums.GameStatus.XWins)
        );
        var draws = games.Count(g => g.Status == Domain.Enums.GameStatus.Draw);
        var winRate = gamesPlayed > 0 ? (double)wins / gamesPlayed * 100 : 0;

        // Score pondéré : (victoires × 3) + (nuls × 1) - (défaites × 1)
        var score = (wins * 3) + (draws * 1) - (losses * 1);

        // Calculer le rang basé sur le score
        int rank;
        
        // Récupérer tous les utilisateurs et calculer leurs scores
        var allUsers = await _context.Users.ToListAsync();
        var userScores = new List<(Guid userId, int score, int gamesPlayed)>();
        
        foreach (var u in allUsers)
        {
            var userGames = await _context.Games
                .Where(g => (g.PlayerXId == u.Id || g.PlayerOId == u.Id) &&
                           (g.Status == Domain.Enums.GameStatus.XWins || 
                            g.Status == Domain.Enums.GameStatus.OWins || 
                            g.Status == Domain.Enums.GameStatus.Draw))
                .ToListAsync();
            
            var userWins = userGames.Count(g => 
                (g.PlayerXId == u.Id && g.Status == Domain.Enums.GameStatus.XWins) ||
                (g.PlayerOId == u.Id && g.Status == Domain.Enums.GameStatus.OWins)
            );
            var userLosses = userGames.Count(g => 
                (g.PlayerXId == u.Id && g.Status == Domain.Enums.GameStatus.OWins) ||
                (g.PlayerOId == u.Id && g.Status == Domain.Enums.GameStatus.XWins)
            );
            var userDraws = userGames.Count(g => g.Status == Domain.Enums.GameStatus.Draw);
            var userScore = (userWins * 3) + (userDraws * 1) - (userLosses * 1);
            
            userScores.Add((u.Id, userScore, userGames.Count));
        }
        
        // Trier par nombre de parties (joueurs actifs d'abord), puis par score décroissant
        var sortedScores = userScores
            .OrderByDescending(x => x.gamesPlayed > 0 ? 1 : 0) // Joueurs avec parties d'abord
            .ThenByDescending(x => x.score)
            .ThenByDescending(x => x.gamesPlayed > 0 ? (double)x.score / x.gamesPlayed : 0)
            .ToList();
        
        var userIndex = sortedScores.FindIndex(x => x.userId == userGuid);
        rank = userIndex >= 0 ? userIndex + 1 : sortedScores.Count + 1;

        return Ok(new
        {
            gamesPlayed,
            wins,
            losses,
            draws,
            winRate,
            score,
            rank
        });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(Guid.Parse(userId));
        if (user == null)
        {
            return NotFound();
        }

        // Vérifier si le username est déjà pris par un autre utilisateur
        if (!string.IsNullOrEmpty(request.Username) && request.Username != user.Username)
        {
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Ce nom d'utilisateur est déjà pris" });
            }
            user.UpdateUsername(request.Username);
        }

        // Mettre à jour les autres champs si fournis
        if (!string.IsNullOrEmpty(request.Email))
        {
            user.UpdateEmail(request.Email);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = user.Id,
            username = user.Username,
            email = user.Email
        });
    }
}

public class UpdateProfileRequest
{
    public string? Username { get; set; }
    public string? Email { get; set; }
}
