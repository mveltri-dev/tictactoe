using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Database.Configurations;

public class GameConfiguration : IEntityTypeConfiguration<Game>
{
    public void Configure(EntityTypeBuilder<Game> builder)
    {
        builder.HasKey(g => g.Id);

        builder.Property(g => g.Width)
            .IsRequired();

        builder.Property(g => g.Height)
            .IsRequired();

        builder.Property(g => g.Board)
            .IsRequired();

        builder.Property(g => g.PlayerXId)
            .IsRequired();

        builder.Property(g => g.PlayerOId)
            .IsRequired();

        builder.Property(g => g.CurrentTurn)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(g => g.Status)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(g => g.Mode)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(g => g.WinnerId);

        builder.Property(g => g.WinningLine)
            .HasColumnType("jsonb");

        builder.Property(g => g.CreatedAt)
            .IsRequired();

        // Relations avec User
        builder.HasOne(g => g.PlayerX)
            .WithMany()
            .HasForeignKey(g => g.PlayerXId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(g => g.PlayerO)
            .WithMany()
            .HasForeignKey(g => g.PlayerOId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
