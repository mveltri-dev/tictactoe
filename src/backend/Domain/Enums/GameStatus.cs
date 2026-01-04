namespace Domain.Enums;

/// <summary>
/// Représente les différents états possibles d'une partie de Tic-Tac-Toe.
/// </summary>
public enum GameStatus
{
    /// <summary>
    /// La partie est en cours, aucun joueur n'a encore gagné.
    /// </summary>
    InProgress,

    /// <summary>
    /// Le joueur X a remporté la partie (3 symboles alignés).
    /// </summary>
    XWins,

    /// <summary>
    /// Le joueur O a remporté la partie (3 symboles alignés).
    /// </summary>
    OWins,

    /// <summary>
    /// Match nul - Toutes les cases sont remplies sans vainqueur.
    /// </summary>
    Draw
}