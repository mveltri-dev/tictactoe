namespace Application.Interfaces;

public interface IGameNotificationService
{
    Task NotifyPlayerJoinedRoom(string roomCode, string playerName, string playerSymbol);
    Task NotifyGameStarted(string roomCode, string gameId);
    Task NotifyMovePlayed(string gameId, int position, string symbol, string nextPlayer);
    Task NotifyGameEnded(string gameId, string? winnerId, bool isDraw);
    Task NotifyRoomClosed(string roomCode, string reason);
}
