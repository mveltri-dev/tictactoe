namespace Application.DTOs.Responses;

/// <summary>
/// Représentation d'une partie de Tic-Tac-Toe pour l'API.
/// </summary>
public class GameDTO
{
    /// <summary>
    /// Identifiant unique de la partie.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Plateau de jeu avec 9 cases.
    /// Chaque case contient "X", "O" ou null (vide).
    /// Index: [0][1][2] / [3][4][5] / [6][7][8]
    /// </summary>
    public required string?[] Board { get; set; }

    /// <summary>
    /// Identifiant du joueur X.
    /// </summary>
    public Guid PlayerXId { get; set; }

    /// <summary>
    /// Identifiant du joueur O.
    /// </summary>
    public Guid PlayerOId { get; set; }

    /// <summary>
    /// Symbole du joueur dont c'est le tour ("X" ou "O").
    /// </summary>
    public required string CurrentTurn { get; set; }

    /// <summary>
    /// État de la partie : "InProgress", "XWins", "OWins" ou "Draw".
    /// </summary>
    public required string Status { get; set; }

    /// <summary>
    /// Identifiant du joueur gagnant, ou null si pas de gagnant.
    /// </summary>
    public Guid? WinnerId { get; set; }

    /// <summary>
    /// Date et heure de création de la partie.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Mode de jeu : "VsComputer", "VsPlayerLocal" ou "VsPlayerOnline".
    /// </summary>
    public required string Mode { get; set; }
}
