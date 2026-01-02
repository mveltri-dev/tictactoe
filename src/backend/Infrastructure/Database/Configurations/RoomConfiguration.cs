using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Database.Configurations;

public class RoomConfiguration : IEntityTypeConfiguration<Room>
{
    public void Configure(EntityTypeBuilder<Room> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Name)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(r => r.Code)
            .HasMaxLength(6)
            .IsRequired();

        builder.HasIndex(r => r.Code)
            .IsUnique();

        builder.Property(r => r.Status)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(r => r.CreatedAt)
            .IsRequired();

        builder.Property(r => r.UpdatedAt)
            .IsRequired();

        // Relations
        builder.HasOne(r => r.Host)
            .WithMany()
            .HasForeignKey(r => r.HostId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Guest)
            .WithMany()
            .HasForeignKey(r => r.GuestId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasOne(r => r.Game)
            .WithMany()
            .HasForeignKey(r => r.GameId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);
    }
}
