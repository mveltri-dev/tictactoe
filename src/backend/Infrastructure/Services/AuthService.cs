using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Domain.Entities;
using Application.DTOs.Requests;
using Application.DTOs.Responses;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using BCrypt.Net;

namespace Infrastructure.Services;

/// <summary>
/// Service gérant l'authentification des utilisateurs (inscription, connexion, JWT).
/// </summary>
public class AuthService
{
    private readonly TicTacToeDbContext _dbContext;
    private readonly IConfiguration _configuration;

    public AuthService(TicTacToeDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    /// <summary>
    /// Enregistre un nouvel utilisateur.
    /// </summary>
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // Validation
        if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Length < 3)
            throw new ArgumentException("Le nom d'utilisateur doit contenir au moins 3 caractères.");

        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            throw new ArgumentException("Adresse email invalide.");

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            throw new ArgumentException("Le mot de passe doit contenir au moins 6 caractères.");

        // Vérifier si l'email existe déjà
        var emailExists = await _dbContext.Users.AnyAsync(u => u.Email == request.Email.ToLowerInvariant());
        if (emailExists)
            throw new InvalidOperationException("Cet email est déjà utilisé.");

        // Vérifier si le username existe déjà
        var usernameExists = await _dbContext.Users.AnyAsync(u => u.Username == request.Username);
        if (usernameExists)
            throw new InvalidOperationException("Ce nom d'utilisateur est déjà pris.");

        // Hash du mot de passe
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Créer l'utilisateur
        var user = new User(request.Username, request.Email, passwordHash);

        await _dbContext.Users.AddAsync(user);
        await _dbContext.SaveChangesAsync();

        // Générer le token JWT
        var token = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddDays(7);

        return new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserDTO
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            }
        };
    }

    /// <summary>
    /// Connecte un utilisateur existant.
    /// </summary>
    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.EmailOrUsername))
            throw new ArgumentException("Email ou nom d'utilisateur requis.");

        if (string.IsNullOrWhiteSpace(request.Password))
            throw new ArgumentException("Mot de passe requis.");

        // Chercher par email ou username
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => 
                u.Email == request.EmailOrUsername.ToLowerInvariant() || 
                u.Username == request.EmailOrUsername);

        if (user == null)
            throw new UnauthorizedAccessException("Email/nom d'utilisateur ou mot de passe incorrect.");

        // Vérifier le mot de passe
        var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!isPasswordValid)
            throw new UnauthorizedAccessException("Email/nom d'utilisateur ou mot de passe incorrect.");

        // Mettre à jour la dernière connexion
        user.UpdateLastLogin();
        await _dbContext.SaveChangesAsync();

        // Générer le token JWT
        var token = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddDays(7);

        return new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserDTO
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            }
        };
    }

    /// <summary>
    /// Génère un token JWT pour un utilisateur.
    /// </summary>
    private string GenerateJwtToken(User user)
    {
        var jwtSecret = _configuration["Jwt:Secret"] ?? throw new InvalidOperationException("JWT Secret non configuré.");
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "TicTacToeApi";
        var jwtAudience = _configuration["Jwt:Audience"] ?? "TicTacToeClient";

        // LOG DEBUG
        Console.WriteLine($"@@@@++++++++++DEBUG++++ [AuthService] JWT_SECRET used for token generation: {jwtSecret}");
        Console.WriteLine($"@@@@++++++++++DEBUG++++ [AuthService] JWT_ISSUER: {jwtIssuer}, JWT_AUDIENCE: {jwtAudience}");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        Console.WriteLine($"@@@@++++++++++DEBUG++++ [AuthService] JWT generated: {tokenString}");
        return tokenString;
    }
}
