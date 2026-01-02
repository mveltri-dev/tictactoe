using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Représente une salle d'attente pour parties multijoueur en ligne.
/// </summary>
public class Room
{
    /// <summary>
    /// Identifiant unique de la room.
    /// </summary>
    public Guid Id { get; private set; }

    /// <summary>
    /// Nom de la room.
    /// </summary>
    public string Name { get; private set; }

    /// <summary>
    /// Code d'accès court (6 caractères) pour rejoindre facilement.
    /// </summary>
    public string Code { get; private set; }

    /// <summary>
    /// Identifiant du créateur de la room.
    /// </summary>
    public Guid HostId { get; private set; }

    /// <summary>
    /// Navigation vers l'utilisateur hôte.
    /// </summary>
    public User? Host { get; private set; }

    /// <summary>
    /// Identifiant du joueur qui a rejoint (null si en attente).
    /// </summary>
    public Guid? GuestId { get; private set; }

    /// <summary>
    /// Navigation vers l'utilisateur invité.
    /// </summary>
    public User? Guest { get; private set; }

    /// <summary>
    /// Statut de la room.
    /// </summary>
    public RoomStatus Status { get; private set; }

    /// <summary>
    /// Identifiant de la partie en cours (null si pas commencée).
    /// </summary>
    public Guid? GameId { get; private set; }

    /// <summary>
    /// Navigation vers la partie.
    /// </summary>
    public Game? Game { get; private set; }

    /// <summary>
    /// Date de création de la room.
    /// </summary>
    public DateTime CreatedAt { get; private set; }

    /// <summary>
    /// Date de dernière activité.
    /// </summary>
    public DateTime UpdatedAt { get; private set; }

    /// <summary>
    /// Constructeur pour créer une nouvelle room.
    /// </summary>
    public Room(string name, Guid hostId)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Le nom de la room ne peut pas être vide.", nameof(name));
        }

        Id = Guid.NewGuid();
        Name = name.Trim();
        Code = GenerateCode();
        HostId = hostId;
        GuestId = null;
        Status = RoomStatus.Waiting;
        GameId = null;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Génère un code court aléatoire pour la room.
    /// </summary>
    private static string GenerateCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Sans O, I, 0, 1
        var random = new Random();
        return new string(Enumerable.Range(0, 6)
            .Select(_ => chars[random.Next(chars.Length)])
            .ToArray());
    }

    /// <summary>
    /// Un joueur rejoint la room.
    /// </summary>
    public void JoinRoom(Guid guestId)
    {
        if (Status != RoomStatus.Waiting)
        {
            throw new InvalidOperationException("La room n'est pas disponible.");
        }

        if (guestId == HostId)
        {
            throw new InvalidOperationException("Vous ne pouvez pas rejoindre votre propre room.");
        }

        GuestId = guestId;
        Status = RoomStatus.Ready;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Démarre la partie dans la room.
    /// </summary>
    public void StartGame(Guid gameId)
    {
        if (Status != RoomStatus.Ready)
        {
            throw new InvalidOperationException("La room n'est pas prête à démarrer.");
        }

        if (!GuestId.HasValue)
        {
            throw new InvalidOperationException("Aucun joueur invité dans la room.");
        }

        GameId = gameId;
        Status = RoomStatus.Playing;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Termine la partie dans la room.
    /// </summary>
    public void EndGame()
    {
        if (Status != RoomStatus.Playing)
        {
            throw new InvalidOperationException("Aucune partie en cours.");
        }

        Status = RoomStatus.Finished;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Ferme la room.
    /// </summary>
    public void Close()
    {
        Status = RoomStatus.Closed;
        UpdatedAt = DateTime.UtcNow;
    }
}
