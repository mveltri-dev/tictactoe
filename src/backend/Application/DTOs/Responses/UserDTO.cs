namespace Application.DTOs.Responses;

/// <summary>
/// DTO représentant un utilisateur (sans données sensibles).
/// </summary>
public class UserDTO
{
    /// <summary>
    /// Identifiant unique de l'utilisateur.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Nom d'utilisateur.
    /// </summary>
    public required string Username { get; set; }

    /// <summary>
    /// Adresse email.
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// Date de création du compte.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
