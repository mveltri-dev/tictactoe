namespace Domain.Enums;

/// <summary>
/// Mode de jeu pour une partie de Tic-Tac-Toe.
/// </summary>
public enum GameMode
{
    /// <summary>
    /// Joueur contre l'ordinateur (IA).
    /// </summary>
    VsComputer,

    /// <summary>
    /// Deux joueurs en local sur le même ordinateur.
    /// </summary>
    VsPlayerLocal,

    /// <summary>
    /// Deux joueurs en ligne.
    /// </summary>
    VsPlayerOnline
}
