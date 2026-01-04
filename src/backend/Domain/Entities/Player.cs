using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Représente un joueur participant à une partie de Tic-Tac-Toe.
/// </summary>
public class Player
{
    /// <summary>
    /// Identifiant unique du joueur.
    /// </summary>
    public Guid Id { get; private set; }

    /// <summary>
    /// Nom du joueur.
    /// </summary>
    public string Name { get; private set; }

    /// <summary>
    /// Symbole attribué au joueur (X ou O).
    /// </summary>
    public PlayerSymbol Symbol { get; private set; }

    /// <summary>
    /// Type de joueur (humain ou ordinateur).
    /// </summary>
    public PlayerType Type { get; private set; }

    /// <summary>
    /// Constructeur pour créer un nouveau joueur.
    /// </summary>
    /// <param name="name">Nom du joueur.</param>
    /// <param name="symbol">Symbole du joueur (X ou O).</param>
    /// <param name="type">Type de joueur (Human ou Computer).</param>
    public Player(string name, PlayerSymbol symbol, PlayerType type)
    {
        Id = Guid.NewGuid();
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Symbol = symbol;
        Type = type;
    }
}