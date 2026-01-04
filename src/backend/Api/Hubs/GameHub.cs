using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using Application.DTOs.Responses;

namespace Api.Hubs;

/// <summary>
/// Hub SignalR pour les notifications temps réel du jeu.
/// </summary>
[Authorize]
public class GameHub : Hub
{
    /// <summary>
    /// Appelé quand un client se connecte.
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"[SignalR Hub] OnConnectedAsync appelé - ConnectionId: {Context.ConnectionId}");
        Console.WriteLine($"[SignalR Hub] User authentifié: {Context.User?.Identity?.IsAuthenticated}");
        
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"[SignalR Hub] NameIdentifier trouvé: {userId ?? "NULL"}");
        
        // Essayons aussi avec "sub" qui est le claim standard JWT
        if (userId == null)
        {
            userId = Context.User?.FindFirst("sub")?.Value;
            Console.WriteLine($"[SignalR Hub] 'sub' claim trouvé: {userId ?? "NULL"}");
        }
        
        if (userId != null)
        {
            var groupName = $"user_{userId}";
            Console.WriteLine($"[SignalR Hub] User {userId} rejoint le groupe: {groupName}");
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }
        else
        {
            Console.WriteLine("[SignalR Hub] ❌ userId est NULL - l'utilisateur ne rejoindra aucun groupe !");
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
            // Notifier les autres joueurs de la partie si applicable
            if (Context.Items.TryGetValue("gameId", out var gameIdObj) && gameIdObj is string gameId)
            {
                Console.WriteLine($"[SignalR Hub] OnDisconnectedAsync: OpponentLeft envoyé au groupe game_{gameId} pour userId={userId}");
                await Clients.Group($"game_{gameId}").SendAsync("OpponentLeft", userId);
            }
            else
            {
                Console.WriteLine($"[SignalR Hub] OnDisconnectedAsync: Pas de gameId dans Context.Items pour userId={userId}");
            }
        }
        else
        {
            Console.WriteLine("[SignalR Hub] OnDisconnectedAsync: userId est NULL");
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
        // Stocker le gameId dans Context.Items pour le récupérer lors de la déconnexion
        Context.Items["gameId"] = gameId;
    }

    /// <summary>
    /// Quitter un groupe de partie.
    /// </summary>
    public async Task LeaveGame(string gameId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"game_{gameId}");
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId != null)
        {
            Console.WriteLine($"[SignalR Hub] LeaveGame: OpponentLeft envoyé au groupe game_{gameId} pour userId={userId}");
            await Clients.Group($"game_{gameId}").SendAsync("OpponentLeft", userId);
        }
        else
        {
            Console.WriteLine($"[SignalR Hub] LeaveGame: userId est NULL pour gameId={gameId}");
        }
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
