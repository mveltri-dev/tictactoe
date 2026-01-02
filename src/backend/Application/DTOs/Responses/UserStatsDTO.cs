namespace Application.DTOs.Responses;

/// <summary>
/// Statistiques d'un utilisateur.
/// </summary>
public class UserStatsDTO
{
    /// <summary>
    /// Identifiant de l'utilisateur.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Nom d'utilisateur.
    /// </summary>
    public required string Username { get; set; }

    /// <summary>
    /// Nombre total de parties jouées.
    /// </summary>
    public int TotalGames { get; set; }

    /// <summary>
    /// Nombre de victoires.
    /// </summary>
    public int Wins { get; set; }

    /// <summary>
    /// Nombre de défaites.
    /// </summary>
    public int Losses { get; set; }

    /// <summary>
    /// Nombre de matchs nuls.
    /// </summary>
    public int Draws { get; set; }

    /// <summary>
    /// Ratio de victoires (wins / total games), entre 0 et 1.
    /// </summary>
    public double WinRate { get; set; }

    /// <summary>
    /// Date de la dernière partie jouée.
    /// </summary>
    public DateTime? LastGameAt { get; set; }
}
