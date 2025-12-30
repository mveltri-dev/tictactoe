using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Représente une partie de Tic-Tac-Toe.
/// </summary>
public class Game
{
    /// <summary>
    /// Identifiant unique de la partie.
    /// </summary>
    public Guid Id { get; private set; }

    /// <summary>
    /// Plateau de jeu représenté par un tableau de 9 cases.
    /// Chaque case peut contenir X, O ou null (vide).
    /// Index: [0][1][2] / [3][4][5] / [6][7][8]
    /// </summary>
    public PlayerSymbol?[] Board { get; private set; }

    /// <summary>
    /// Identifiant du joueur utilisant le symbole X.
    /// </summary>
    public Guid PlayerXId { get; private set; }

    /// <summary>
    /// Identifiant du joueur utilisant le symbole O.
    /// </summary>
    public Guid PlayerOId { get; private set; }

    /// <summary>
    /// Symbole du joueur dont c'est le tour de jouer.
    /// </summary>
    public PlayerSymbol CurrentTurn { get; set; }

    /// <summary>
    /// État actuel de la partie (en cours, gagnée, nulle).
    /// </summary>
    public GameStatus Status { get; set; }

    /// <summary>
    /// Identifiant du joueur gagnant, ou null si la partie n'est pas terminée ou est nulle.
    /// </summary>
    public Guid? WinnerId { get; set; }

    /// <summary>
    /// Date et heure de création de la partie.
    /// </summary>
    public DateTime CreatedAt { get; private set; }

    /// <summary>
    /// Mode de jeu (VsComputer, VsPlayerLocal, VsPlayerOnline).
    /// </summary>
    public GameMode Mode { get; private set; }

    /// <summary>
    /// Constructeur pour créer une nouvelle partie.
    /// </summary>
    /// <param name="playerXId">Identifiant du joueur X.</param>
    /// <param name="playerOId">Identifiant du joueur O.</param>
    /// <param name="mode">Mode de jeu.</param>
    public Game(Guid playerXId, Guid playerOId, GameMode mode)
    {
        Id = Guid.NewGuid();
        Board = new PlayerSymbol?[9]; // Plateau vide
        PlayerXId = playerXId;
        PlayerOId = playerOId;
        CurrentTurn = PlayerSymbol.X; // X commence toujours (règle classique)
        Status = GameStatus.InProgress;
        WinnerId = null;
        CreatedAt = DateTime.UtcNow;
        Mode = mode;
    }
}