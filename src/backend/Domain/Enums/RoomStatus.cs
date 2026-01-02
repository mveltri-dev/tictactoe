namespace Domain.Enums;

/// <summary>
/// Statut d'une room multijoueur.
/// </summary>
public enum RoomStatus
{
    /// <summary>
    /// En attente d'un second joueur.
    /// </summary>
    Waiting = 0,

    /// <summary>
    /// Prête à démarrer (2 joueurs présents).
    /// </summary>
    Ready = 1,

    /// <summary>
    /// Partie en cours.
    /// </summary>
    Playing = 2,

    /// <summary>
    /// Partie terminée.
    /// </summary>
    Finished = 3,

    /// <summary>
    /// Room fermée.
    /// </summary>
    Closed = 4
}
