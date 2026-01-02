namespace Application.DTOs.Requests;

/// <summary>
/// Requête pour la connexion d'un utilisateur.
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// Email ou nom d'utilisateur.
    /// </summary>
    public required string EmailOrUsername { get; set; }

    /// <summary>
    /// Mot de passe.
    /// </summary>
    public required string Password { get; set; }
}
