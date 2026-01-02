using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Application.DTOs.Responses;

namespace Application.Hubs;

/// <summary>
/// Hub SignalR pour les notifications temps réel du jeu.
/// </summary>
[Authorize]
public class GameHub : Hub<IGameClient>
{
    /// <summary>
    /// Appelé quand un client se connecte.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Appelé quand un client se déconnecte.
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId != null)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Rejoindre un groupe de room.
    /// </summary>
    public async Task JoinRoom(string roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"room_{roomId}");
    }

    /// <summary>
    /// Quitter un groupe de room.
    /// </summary>
    public async Task LeaveRoom(string roomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"room_{roomId}");
    }

    /// <summary>
    /// Rejoindre un groupe de partie.
    /// </summary>
    public async Task JoinGame(string gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"game_{gameId}");
    }

    /// <summary>
    /// Quitter un groupe de partie.
    /// </summary>
    public async Task LeaveGame(string gameId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"game_{gameId}");
    }
}

/// <summary>
/// Interface pour typer les méthodes côté client.
/// </summary>
public interface IGameClient
{
    /// <summary>
    /// Un joueur a rejoint une room.
    /// </summary>
    Task PlayerJoinedRoom(RoomDTO room);

    /// <summary>
    /// La partie a démarré.
    /// </summary>
    Task GameStarted(RoomDTO room);

    /// <summary>
    /// Un coup a été joué.
    /// </summary>
    Task MovePlayed(GameDTO game);

    /// <summary>
    /// La partie est terminée.
    /// </summary>
    Task GameEnded(GameDTO game);

    /// <summary>
    /// La room a été fermée.
    /// </summary>
    Task RoomClosed(Guid roomId);
}
