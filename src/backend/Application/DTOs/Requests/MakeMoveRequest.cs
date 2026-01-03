using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Requests;

/// <summary>
/// Requête pour jouer un coup dans une partie.
/// </summary>
public class MakeMoveRequest
{
    /// <summary>
    /// Identifiant de la partie.
    /// </summary>
    [Required(ErrorMessage = "L'identifiant de la partie est requis.")]
    public Guid GameId { get; set; }

    /// <summary>
    /// Identifiant du joueur qui joue le coup.
    /// </summary>
    [Required(ErrorMessage = "L'identifiant du joueur est requis.")]
    public Guid PlayerId { get; set; }

    /// <summary>
    /// Position sur le plateau .
    /// </summary>
    [Required(ErrorMessage = "La position est requise.")]
    public int Position { get; set; }
}
