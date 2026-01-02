namespace Application.DTOs.Responses;

/// <summary>
/// Représentation simplifiée d'une partie pour l'historique.
/// </summary>
public class GameHistoryDTO
{
    /// <summary>
    /// Identifiant de la partie.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Mode de jeu.
    /// </summary>
    public required string Mode { get; set; }

    /// <summary>
    /// État final de la partie.
    /// </summary>
    public required string Status { get; set; }

    /// <summary>
    /// Est-ce que l'utilisateur a gagné cette partie.
    /// </summary>
    public bool IsWinner { get; set; }

    /// <summary>
    /// Symbole joué par l'utilisateur (X ou O).
    /// </summary>
    public required string PlayerSymbol { get; set; }

    /// <summary>
    /// Nom de l'adversaire (si disponible).
    /// </summary>
    public string? OpponentName { get; set; }

    /// <summary>
    /// Date de création de la partie.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
