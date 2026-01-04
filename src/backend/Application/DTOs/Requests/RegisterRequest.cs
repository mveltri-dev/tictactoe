namespace Application.DTOs.Requests;

/// <summary>
/// Requête pour l'inscription d'un nouvel utilisateur.
/// </summary>
public class RegisterRequest
{
    /// <summary>
    /// Nom d'utilisateur souhaité (unique).
    /// </summary>
    public required string Username { get; set; }

    /// <summary>
    /// Adresse email (unique).
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// Mot de passe (minimum 6 caractères).
    /// </summary>
    public required string Password { get; set; }
}
