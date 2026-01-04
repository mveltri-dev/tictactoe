using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Requests;

/// <summary>
/// Requête pour créer une nouvelle partie de Tic-Tac-Toe.
/// </summary>
public class CreateGameRequest
{
    /// <summary>
    /// Nom du joueur 1.
    /// </summary>
    [Required(ErrorMessage = "Le nom du joueur 1 est requis.")]
    [StringLength(50, MinimumLength = 1, ErrorMessage = "Le nom doit contenir entre 1 et 50 caractères.")]
    [RegularExpression(@"^[a-zA-Z0-9àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ\s-]+$", ErrorMessage = "Le nom ne peut contenir que des lettres, chiffres, espaces et tirets.")]
    public required string Player1Name { get; set; }

    /// <summary>
    /// Symbole choisi par le joueur 1 ("X" ou "O").
    /// Note : X commence toujours en premier (règle classique).
    /// </summary>
    [Required(ErrorMessage = "Le symbole choisi est requis.")]
    [RegularExpression(@"^(X|O)$", ErrorMessage = "Le symbole doit être 'X' ou 'O'.")]
    public required string ChosenSymbol { get; set; }

    /// <summary>
    /// Mode de jeu : "VsComputer", "VsPlayerLocal" ou "VsPlayerOnline".
    /// </summary>
    [Required(ErrorMessage = "Le mode de jeu est requis.")]
    [RegularExpression(@"^(VsComputer|VsPlayerLocal|VsPlayerOnline)$", ErrorMessage = "Mode invalide. Valeurs acceptées : VsComputer, VsPlayerLocal, VsPlayerOnline.")]
    public required string GameMode { get; set; }

    /// <summary>
    /// Nom du joueur 2 (optionnel, utilisé pour les modes local/online).
    /// Pour VsComputer, ce sera "EasiBot" par défaut.
    /// </summary>
    [StringLength(50, MinimumLength = 1, ErrorMessage = "Le nom doit contenir entre 1 et 50 caractères.")]
    [RegularExpression(@"^[a-zA-Z0-9àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ\s-]+$", ErrorMessage = "Le nom ne peut contenir que des lettres, chiffres, espaces et tirets.")]
    public string? Player2Name { get; set; }

    /// <summary>
    /// Largeur du plateau (nombre de colonnes, minimum 3, défaut 3).
    /// </summary>
    [Range(3, 20, ErrorMessage = "La largeur du plateau doit être comprise entre 3 et 20.")]
    public int Width { get; set; } = 3;

    /// <summary>
    /// Hauteur du plateau (nombre de lignes, minimum 3, défaut 3).
    /// </summary>
    [Range(3, 20, ErrorMessage = "La hauteur du plateau doit être comprise entre 3 et 20.")]
    public int Height { get; set; } = 3;
}
