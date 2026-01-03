using Domain.Enums;

namespace Domain.Entities;

public class Friendship
{
    public int Id { get; private set; }
    public Guid RequesterId { get; private set; }
    public Guid ReceiverId { get; private set; }
    public FriendshipStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // Navigation properties
    public User Requester { get; private set; } = null!;
    public User Receiver { get; private set; } = null!;

    // Constructor pour EF Core
    private Friendship() { }

    public Friendship(Guid requesterId, Guid receiverId)
    {
        if (requesterId == receiverId)
        {
            throw new ArgumentException("Un utilisateur ne peut pas s'ajouter lui-même comme ami");
        }

        RequesterId = requesterId;
        ReceiverId = receiverId;
        Status = FriendshipStatus.Pending;
        CreatedAt = DateTime.UtcNow;
    }

    public void Accept()
    {
        if (Status != FriendshipStatus.Pending)
        {
            throw new InvalidOperationException("Seules les demandes en attente peuvent être acceptées");
        }

        Status = FriendshipStatus.Accepted;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Reject()
    {
        if (Status != FriendshipStatus.Pending)
        {
            throw new InvalidOperationException("Seules les demandes en attente peuvent être refusées");
        }

        Status = FriendshipStatus.Rejected;
        UpdatedAt = DateTime.UtcNow;
    }
}
