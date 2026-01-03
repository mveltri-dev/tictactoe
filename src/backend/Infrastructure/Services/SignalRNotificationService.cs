using Microsoft.AspNetCore.SignalR;
using Application.Interfaces;
using Application.DTOs.Responses;
using Application.Hubs;

namespace Infrastructure.Services;

public class SignalRNotificationService : IGameNotificationService
{
    private readonly IHubContext<GameHub, IGameClient> _hubContext;

    public SignalRNotificationService(IHubContext<GameHub, IGameClient> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyPlayerJoinedRoom(string roomCode, string playerName, string playerSymbol)
    {
        // Notification simple - le client devra refetch les données de la room
        await _hubContext.Clients.Group($"room_{roomCode}")
            .PlayerJoinedRoom(new RoomDTO
            {
                Code = roomCode,
                Name = $"Room {roomCode}",
                HostUsername = "Host",
                Status = Domain.Enums.RoomStatus.Waiting.ToString()
            });
    }

    public async Task NotifyGameStarted(string roomCode, string gameId)
    {
        await _hubContext.Clients.Group($"room_{roomCode}")
            .GameStarted(new RoomDTO
            {
                Code = roomCode,
                Name = $"Room {roomCode}",
                HostUsername = "Host",
                Status = Domain.Enums.RoomStatus.Playing.ToString()
            });
    }

    public async Task NotifyMovePlayed(string gameId, int position, string symbol, string nextPlayer)
    {
        await _hubContext.Clients.Group($"game_{gameId}")
            .MovePlayed(new GameDTO
            {
                Id = Guid.Parse(gameId),
                Board = new string[9],
                CurrentTurn = "X",
                Status = Domain.Enums.GameStatus.InProgress.ToString(),
                Mode = Domain.Enums.GameMode.VsPlayerOnline.ToString()
            });
    }

    public async Task NotifyGameEnded(string gameId, string? winnerId, bool isDraw)
    {
        var status = isDraw ? Domain.Enums.GameStatus.Draw : Domain.Enums.GameStatus.XWins;
        
        await _hubContext.Clients.Group($"game_{gameId}")
            .GameEnded(new GameDTO
            {
                Id = Guid.Parse(gameId),
                Board = new string[9],
                CurrentTurn = "X",
                Status = status.ToString(),
                Mode = Domain.Enums.GameMode.VsPlayerOnline.ToString()
            });
    }

    public async Task NotifyRoomClosed(string roomCode, string reason)
    {
        await _hubContext.Clients.Group($"room_{roomCode}")
            .RoomClosed(Guid.Empty);
    }
}
