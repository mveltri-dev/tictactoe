using Domain.Entities;
using Application.DTOs.Responses;

namespace Application.Mappers;

/// <summary>
/// Mapper pour convertir les entités Game en DTOs et vice-versa.
/// </summary>
public static class GameMapper
{
    /// <summary>
    /// Convertit une entité Game en GameDTO pour l'API.
    /// </summary>
    /// <param name="game">Entité Game à convertir.</param>
    /// <returns>GameDTO correspondant.</returns>
    public static GameDTO ToDTO(Game game)
    {
        // Pour PlayerXName et PlayerOName, on utilise Username (User) si disponible
        // Si c'est une partie locale, les noms seront null dans le DTO et devront être fournis par le frontend
        return new GameDTO
        {
            Id = game.Id,
            Board = game.Board.Select(s => s?.ToString()).ToArray(), // X, O ou null
            PlayerXId = game.PlayerXId,
            PlayerOId = game.PlayerOId,
            PlayerXName = game.PlayerX?.Username,
            PlayerOName = game.PlayerO?.Username,
            CurrentTurn = game.CurrentTurn.ToString(), // "X" ou "O"
            Status = game.Status.ToString(), // "InProgress", "XWins", etc.
            WinnerId = game.WinnerId,
                // WinningLine = game.WinningLine,
            CreatedAt = game.CreatedAt,
            Mode = game.Mode.ToString() // "VsComputer", "VsPlayerLocal", etc.
        };
    }

    /// <summary>
    /// Convertit un Player en PlayerDTO pour l'API.
    /// </summary>
    /// <param name="player">Entité Player à convertir.</param>
    /// <returns>PlayerDTO correspondant.</returns>
    public static PlayerDTO ToDTO(Player player)
    {
        return new PlayerDTO
        {
            Id = player.Id,
            Name = player.Name,
            Symbol = player.Symbol.ToString() // "X" ou "O"
        };
    }
}
