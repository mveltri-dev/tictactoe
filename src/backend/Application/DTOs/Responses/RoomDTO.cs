namespace Application.DTOs.Responses;

/// <summary>
/// Représentation d'une room pour l'API.
/// </summary>
public class RoomDTO
{
    /// <summary>
    /// Identifiant de la room.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Nom de la room.
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Code pour rejoindre la room.
    /// </summary>
    public required string Code { get; set; }

    /// <summary>
    /// Nom d'utilisateur de l'hôte.
    /// </summary>
    public required string HostUsername { get; set; }

    /// <summary>
    /// Nom d'utilisateur de l'invité (null si pas encore rejoint).
    /// </summary>
    public string? GuestUsername { get; set; }

    /// <summary>
    /// Statut de la room.
    /// </summary>
    public required string Status { get; set; }

    /// <summary>
    /// Identifiant de la partie (null si pas commencée).
    /// </summary>
    public Guid? GameId { get; set; }

    /// <summary>
    /// Date de création.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Date de dernière mise à jour.
    /// </summary>
    public DateTime UpdatedAt { get; set; }
}
