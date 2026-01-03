using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Database.Configurations;

public class FriendshipConfiguration : IEntityTypeConfiguration<Friendship>
{
    public void Configure(EntityTypeBuilder<Friendship> builder)
    {
        builder.HasKey(f => f.Id);

        builder.Property(f => f.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(f => f.CreatedAt)
            .IsRequired();

        // Relation avec User (Requester)
        builder.HasOne(f => f.Requester)
            .WithMany()
            .HasForeignKey(f => f.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);

        // Relation avec User (Receiver)
        builder.HasOne(f => f.Receiver)
            .WithMany()
            .HasForeignKey(f => f.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        // Index pour optimiser les recherches
        builder.HasIndex(f => new { f.RequesterId, f.ReceiverId })
            .IsUnique();

        builder.HasIndex(f => f.Status);
    }
}
