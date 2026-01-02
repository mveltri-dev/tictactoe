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
    /// Largeur du plateau (nombre de colonnes).
    /// </summary>
    public int Width { get; private set; }

    /// <summary>
    /// Hauteur du plateau (nombre de lignes).
    /// </summary>
    public int Height { get; private set; }

    /// <summary>
    /// Plateau de jeu représenté par un tableau de Width*Height cases.
    /// Chaque case peut contenir X, O ou null (vide).
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
    /// Positions des cases formant la ligne gagnante (3 positions), ou null si pas de gagnant.
    /// </summary>
    public int[]? WinningLine { get; set; }

    /// <summary>
    /// Date et heure de création de la partie.
    /// </summary>
    public DateTime CreatedAt { get; private set; }

    /// <summary>
    /// Mode de jeu (VsComputer, VsPlayerLocal, VsPlayerOnline).
    /// </summary>
    public GameMode Mode { get; private set; }

    /// <summary>
    /// Navigation property vers l'utilisateur X.
    /// </summary>
    public User? PlayerX { get; private set; }

    /// <summary>
    /// Navigation property vers l'utilisateur O.
    /// </summary>
    public User? PlayerO { get; private set; }

    /// <summary>
    /// Constructeur pour créer une nouvelle partie.
    /// </summary>
    /// <param name="playerXId">Identifiant du joueur X.</param>
    /// <param name="playerOId">Identifiant du joueur O.</param>
    /// <param name="mode">Mode de jeu.</param>
    /// <param name="width">Largeur du plateau (3 par défaut).</param>
    /// <param name="height">Hauteur du plateau (3 par défaut).</param>
    public Game(Guid playerXId, Guid playerOId, GameMode mode, int width = 3, int height = 3)
    {
        if (width < 3)
        {
            throw new ArgumentException("La largeur du plateau doit être au minimum 3.", nameof(width));
        }

        if (height < 3)
        {
            throw new ArgumentException("La hauteur du plateau doit être au minimum 3.", nameof(height));
        }

        Id = Guid.NewGuid();
        Width = width;
        Height = height;
        Board = new PlayerSymbol?[width * height]; // Plateau vide de taille width x height
        PlayerXId = playerXId;
        PlayerOId = playerOId;
        CurrentTurn = PlayerSymbol.X; // X commence
        Status = GameStatus.InProgress;
        WinnerId = null;
        WinningLine = null;
        CreatedAt = DateTime.UtcNow;
        Mode = mode;
    }
}