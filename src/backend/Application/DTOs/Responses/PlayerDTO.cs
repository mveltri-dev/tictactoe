namespace Application.DTOs.Responses;

/// <summary>
/// Représentation d'un joueur pour l'API.
/// </summary>
public class PlayerDTO
{
    /// <summary>
    /// Identifiant unique du joueur.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Nom du joueur.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Symbole du joueur ("X" ou "O").
    /// </summary>
    public required string Symbol { get; set; }
}
