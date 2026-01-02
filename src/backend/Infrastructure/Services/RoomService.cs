using Domain.Entities;
using Domain.Enums;
using Application.DTOs.Responses;
using Application.Interfaces;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

/// <summary>
/// Service gérant les rooms multijoueur.
/// </summary>
public class RoomService
{
    private readonly TicTacToeDbContext _dbContext;
    private readonly GameService _gameService;
    private readonly IGameNotificationService? _notificationService;

    public RoomService(
        TicTacToeDbContext dbContext, 
        GameService gameService,
        IGameNotificationService? notificationService = null)
    {
        _dbContext = dbContext;
        _gameService = gameService;
        _notificationService = notificationService;
    }

    /// <summary>
    /// Crée une nouvelle room.
    /// </summary>
    public async Task<RoomDTO> CreateRoom(string name, Guid hostId)
    {
        var host = await _dbContext.Users.FindAsync(hostId);
        if (host == null)
        {
            throw new KeyNotFoundException("Utilisateur non trouvé");
        }

        var room = new Room(name, hostId);
        
        _dbContext.Rooms.Add(room);
        await _dbContext.SaveChangesAsync();

        // Reload avec navigation properties
        var createdRoom = await _dbContext.Rooms
            .Include(r => r.Host)
            .Include(r => r.Guest)
            .FirstAsync(r => r.Id == room.Id);

        return ToDTO(createdRoom);
    }

    /// <summary>
    /// Récupère une room par son ID.
    /// </summary>
    public async Task<RoomDTO?> GetRoomById(Guid roomId)
    {
        var room = await _dbContext.Rooms
            .Include(r => r.Host)
            .Include(r => r.Guest)
            .Include(r => r.Game)
            .FirstOrDefaultAsync(r => r.Id == roomId);

        return room != null ? ToDTO(room) : null;
    }

    /// <summary>
    /// Récupère une room par son code.
    /// </summary>
    public async Task<RoomDTO?> GetRoomByCode(string code)
    {
        var room = await _dbContext.Rooms
            .Include(r => r.Host)
            .Include(r => r.Guest)
            .Include(r => r.Game)
            .FirstOrDefaultAsync(r => r.Code == code.ToUpper());

        return room != null ? ToDTO(room) : null;
    }

    /// <summary>
    /// Liste les rooms disponibles (en attente).
    /// </summary>
    public async Task<List<RoomDTO>> ListAvailableRooms()
    {
        var rooms = await _dbContext.Rooms
            .Include(r => r.Host)
            .Where(r => r.Status == RoomStatus.Waiting)
            .OrderByDescending(r => r.CreatedAt)
            .Take(20)
            .ToListAsync();

        return rooms.Select(ToDTO).ToList();
    }

    /// <summary>
    /// Rejoint une room.
    /// </summary>
    public async Task<RoomDTO> JoinRoom(string code, Guid guestId)
    {
        var room = await _dbContext.Rooms
            .Include(r => r.Host)
            .FirstOrDefaultAsync(r => r.Code == code.ToUpper());

        if (room == null)
        {
            throw new KeyNotFoundException("Room non trouvée");
        }

        var guest = await _dbContext.Users.FindAsync(guestId);
        if (guest == null)
        {
            throw new KeyNotFoundException("Utilisateur non trouvé");
        }

        room.JoinRoom(guestId);
        await _dbContext.SaveChangesAsync();

        // Reload avec guest
        var updatedRoom = await _dbContext.Rooms
            .Include(r => r.Host)
            .Include(r => r.Guest)
            .FirstAsync(r => r.Id == room.Id);

        var roomDto = ToDTO(updatedRoom);

        // Notifier via SignalR
        if (_notificationService != null && guest != null)
        {
            await _notificationService.NotifyPlayerJoinedRoom(
                room.Code, 
                guest.Username, 
                PlayerSymbol.O.ToString());
        }

        return roomDto;
    }

    /// <summary>
    /// Démarre une partie dans une room.
    /// </summary>
    public async Task<RoomDTO> StartGame(Guid roomId, Guid userId)
    {
        var room = await _dbContext.Rooms
            .Include(r => r.Host)
            .Include(r => r.Guest)
            .FirstOrDefaultAsync(r => r.Id == roomId);

        if (room == null)
        {
            throw new KeyNotFoundException("Room non trouvée");
        }

        if (room.HostId != userId)
        {
            throw new UnauthorizedAccessException("Seul l'hôte peut démarrer la partie");
        }

        if (room.Status != RoomStatus.Ready)
        {
            throw new InvalidOperationException("La room n'est pas prête");
        }

        if (!room.GuestId.HasValue)
        {
            throw new InvalidOperationException("Aucun joueur invité");
        }

        // Créer la partie
        var game = new Game(room.HostId, room.GuestId.Value, GameMode.VsPlayerOnline);
        _dbContext.Games.Add(game);
        await _dbContext.SaveChangesAsync();

        // Mettre à jour la room
        room.StartGame(game.Id);
        await _dbContext.SaveChangesAsync();

        // Reload
        var updatedRoom = await _dbContext.Rooms
            .Include(r => r.Host)
            .Include(r => r.Guest)
            .Include(r => r.Game)
            .FirstAsync(r => r.Id == room.Id);

        var roomDto = ToDTO(updatedRoom);

        // Notifier via SignalR
        if (_notificationService != null)
        {
            await _notificationService.NotifyGameStarted(room.Code, game.Id.ToString());
        }

        return roomDto;
    }

    /// <summary>
    /// Ferme une room.
    /// </summary>
    public async Task CloseRoom(Guid roomId, Guid userId)
    {
        var room = await _dbContext.Rooms.FindAsync(roomId);

        if (room == null)
        {
            throw new KeyNotFoundException("Room non trouvée");
        }

        if (room.HostId != userId)
        {
            throw new UnauthorizedAccessException("Seul l'hôte peut fermer la room");
        }

        room.Close();
        await _dbContext.SaveChangesAsync();

        // Notifier via SignalR
        if (_notificationService != null)
        {
            await _notificationService.NotifyRoomClosed(room.Code, "Host closed the room");
        }
    }

    /// <summary>
    /// Convertit une Room en RoomDTO.
    /// </summary>
    private static RoomDTO ToDTO(Room room)
    {
        return new RoomDTO
        {
            Id = room.Id,
            Name = room.Name,
            Code = room.Code,
            HostUsername = room.Host?.Username ?? "Unknown",
            GuestUsername = room.Guest?.Username,
            Status = room.Status.ToString(),
            GameId = room.GameId,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt
        };
    }
}
