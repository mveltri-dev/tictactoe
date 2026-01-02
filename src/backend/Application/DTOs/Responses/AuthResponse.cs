namespace Application.DTOs.Responses;

/// <summary>
/// Réponse d'authentification contenant le token JWT et les infos utilisateur.
/// </summary>
public class AuthResponse
{
    /// <summary>
    /// Token JWT pour l'authentification.
    /// </summary>
    public required string Token { get; set; }

    /// <summary>
    /// Date d'expiration du token.
    /// </summary>
    public required DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Informations de l'utilisateur.
    /// </summary>
    public required UserDTO User { get; set; }
}
