using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Requests;

/// <summary>
/// Requête pour rejoindre une room par son code.
/// </summary>
public class JoinRoomRequest
{
    /// <summary>
    /// Code de la room (6 caractères).
    /// </summary>
    [Required(ErrorMessage = "Le code de la room est requis.")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Le code doit contenir exactement 6 caractères.")]
    [RegularExpression(@"^[A-Z0-9]{6}$", ErrorMessage = "Le code doit contenir uniquement des lettres majuscules et chiffres.")]
    public required string Code { get; set; }
}
