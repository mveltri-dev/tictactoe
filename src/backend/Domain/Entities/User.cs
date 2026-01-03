namespace Domain.Entities;

/// <summary>
/// Représente un utilisateur enregistré de l'application.
/// </summary>
public class User
{
    /// <summary>
    /// Identifiant unique de l'utilisateur.
    /// </summary>
    public Guid Id { get; private set; }

    /// <summary>
    /// Nom d'utilisateur unique.
    /// </summary>
    public string Username { get; private set; }

    /// <summary>
    /// Adresse email unique.
    /// </summary>
    public string Email { get; private set; }

    /// <summary>
    /// Hash du mot de passe (BCrypt).
    /// </summary>
    public string PasswordHash { get; private set; }

    /// <summary>
    /// Date de création du compte.
    /// </summary>
    public DateTime CreatedAt { get; private set; }

    /// <summary>
    /// Date de dernière connexion.
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// Constructeur pour créer un nouvel utilisateur.
    /// </summary>
    /// <param name="username">Nom d'utilisateur.</param>
    /// <param name="email">Adresse email.</param>
    /// <param name="passwordHash">Hash du mot de passe.</param>
    public User(string username, string email, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(username))
            throw new ArgumentException("Le nom d'utilisateur ne peut pas être vide.", nameof(username));
        
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("L'email ne peut pas être vide.", nameof(email));
        
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("Le hash du mot de passe ne peut pas être vide.", nameof(passwordHash));

        Id = Guid.NewGuid();
        Username = username;
        Email = email.ToLowerInvariant(); // Normaliser l'email
        PasswordHash = passwordHash;
        CreatedAt = DateTime.UtcNow;
        LastLoginAt = null;
    }

    /// <summary>
    /// Constructeur privé pour EF Core.
    /// </summary>
    private User() { }

    /// <summary>
    /// Met à jour la date de dernière connexion.
    /// </summary>
    public void UpdateLastLogin()
    {
        LastLoginAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Met à jour le nom d'utilisateur.
    /// </summary>
    /// <param name="username">Nouveau nom d'utilisateur.</param>
    public void UpdateUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
            throw new ArgumentException("Le nom d'utilisateur ne peut pas être vide.", nameof(username));
        
        Username = username;
    }

    /// <summary>
    /// Met à jour l'adresse email.
    /// </summary>
    /// <param name="email">Nouvelle adresse email.</param>
    public void UpdateEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("L'email ne peut pas être vide.", nameof(email));
        
        Email = email.ToLowerInvariant();
    }
}
