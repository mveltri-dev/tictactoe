using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Infrastructure.Services;
using Application.DTOs.Requests;
using Application.DTOs.Responses;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// Contrôleur gérant les rooms multijoueur.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoomController : ControllerBase
{
    private readonly RoomService _roomService;

    public RoomController(RoomService roomService)
    {
        _roomService = roomService;
    }

    /// <summary>
    /// Crée une nouvelle room.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(RoomDTO), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateRoom([FromBody] CreateRoomRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? throw new UnauthorizedAccessException("User ID non trouvé"));

            var room = await _roomService.CreateRoom(request.Name, userId);
            return CreatedAtAction(nameof(GetRoom), new { id = room.Id }, room);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }

    /// <summary>
    /// Récupère une room par son ID.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(RoomDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRoom(Guid id)
    {
        try
        {
            var room = await _roomService.GetRoomById(id);
            
            if (room == null)
            {
                return NotFound(new { error = "Room non trouvée" });
            }

            return Ok(room);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }

    /// <summary>
    /// Récupère une room par son code.
    /// </summary>
    [HttpGet("code/{code}")]
    [ProducesResponseType(typeof(RoomDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRoomByCode(string code)
    {
        try
        {
            var room = await _roomService.GetRoomByCode(code);
            
            if (room == null)
            {
                return NotFound(new { error = "Room non trouvée" });
            }

            return Ok(room);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }

    /// <summary>
    /// Liste les rooms disponibles.
    /// </summary>
    [HttpGet("available")]
    [ProducesResponseType(typeof(List<RoomDTO>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAvailableRooms()
    {
        try
        {
            var rooms = await _roomService.ListAvailableRooms();
            return Ok(rooms);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }

    /// <summary>
    /// Rejoint une room.
    /// </summary>
    [HttpPost("join")]
    [ProducesResponseType(typeof(RoomDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> JoinRoom([FromBody] JoinRoomRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? throw new UnauthorizedAccessException("User ID non trouvé"));

            var room = await _roomService.JoinRoom(request.Code, userId);
            return Ok(room);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }

    /// <summary>
    /// Démarre la partie dans une room.
    /// </summary>
    [HttpPost("{id}/start")]
    [ProducesResponseType(typeof(RoomDTO), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StartGame(Guid id)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? throw new UnauthorizedAccessException("User ID non trouvé"));

            var room = await _roomService.StartGame(id, userId);
            return Ok(room);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }

    /// <summary>
    /// Ferme une room.
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloseRoom(Guid id)
    {
        try
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? throw new UnauthorizedAccessException("User ID non trouvé"));

            await _roomService.CloseRoom(id, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Erreur serveur : {ex.Message}" });
        }
    }
}
