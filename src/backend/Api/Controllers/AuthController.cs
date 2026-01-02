using Microsoft.AspNetCore.Mvc;
using Infrastructure.Services;
using Application.DTOs.Requests;
using Application.DTOs.Responses;

namespace Api.Controllers;

/// <summary>
/// Contrôleur gérant l'authentification des utilisateurs.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Enregistre un nouvel utilisateur.
    /// </summary>
    /// <param name="request">Données d'inscription.</param>
    /// <returns>Token JWT et informations utilisateur.</returns>
    /// <response code="200">Inscription réussie.</response>
    /// <response code="400">Données invalides ou utilisateur existant.</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }

    /// <summary>
    /// Connecte un utilisateur existant.
    /// </summary>
    /// <param name="request">Identifiants de connexion.</param>
    /// <returns>Token JWT et informations utilisateur.</returns>
    /// <response code="200">Connexion réussie.</response>
    /// <response code="401">Identifiants incorrects.</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }
}
