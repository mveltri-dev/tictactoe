using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Requests;

/// <summary>
/// Requête pour créer une room multijoueur.
/// </summary>
public class CreateRoomRequest
{
    /// <summary>
    /// Nom de la room.
    /// </summary>
    [Required(ErrorMessage = "Le nom de la room est requis.")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Le nom doit contenir entre 3 et 50 caractères.")]
    public required string Name { get; set; }
}
