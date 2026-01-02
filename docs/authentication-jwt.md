# Authentification JWT - Documentation Complète

## Vue d'ensemble

Système d'authentification complet avec JWT (JSON Web Tokens) et BCrypt pour le hashing des mots de passe.

**Branche**: `feature/authentication-jwt` → Mergée dans `develop`  
**Date**: 2 janvier 2026  
**Statut**: Complété et testé

---

##  Architecture Backend

### Entités Domain

#### **User.cs** (`Domain/Entities/`)
```csharp
- Id (Guid)
- Username (string, unique, 3-50 caractères)
- Email (string, unique, normalisé en minuscules)
- PasswordHash (string, BCrypt)
- CreatedAt (DateTime)
- LastLoginAt (DateTime, nullable)
```

**Validations**:
- Username, Email et PasswordHash non vides
- Email normalisé automatiquement (ToLowerInvariant)
- Méthode `UpdateLastLogin()` pour tracking des sessions

---

### DTOs Application

#### Requests
1. **RegisterRequest.cs**
   - Username (min 3 caractères)
   - Email (format email valide)
   - Password (min 6 caractères)

2. **LoginRequest.cs**
   - EmailOrUsername (flexible)
   - Password

#### Responses
1. **AuthResponse.cs**
   - Token (JWT string)
   - ExpiresAt (DateTime)
   - User (UserDTO)

2. **UserDTO.cs**
   - Id, Username, Email, CreatedAt
   -  Pas de PasswordHash (sécurité)

---

### Services Infrastructure

#### **AuthService.cs** (167 lignes)

**Méthodes principales**:

1. `RegisterAsync(RegisterRequest request)`
   - Validation des données
   - Vérification unicité email/username
   - Hash BCrypt du mot de passe
   - Création utilisateur en DB
   - Génération JWT token
   - Retourne AuthResponse

2. `LoginAsync(LoginRequest request)`
   - Recherche par email OU username
   - Vérification BCrypt du password
   - Mise à jour LastLoginAt
   - Génération JWT token
   - Retourne AuthResponse

3. `GenerateJwtToken(User user)` (privée)
   - Claims: Sub (UserId), Email, UniqueName (Username), Jti (Token ID)
   - Algorithme: HS256
   - Expiration: 7 jours
   - Issuer: TicTacToeApi
   - Audience: TicTacToeClient

---

### API Controllers

#### **AuthController.cs**

**Endpoints**:

1. `POST /api/auth/register`
   - Body: RegisterRequest
   - Retourne: 200 OK + AuthResponse
   - Erreurs: 400 Bad Request (validation), 500 Internal Server Error

2. `POST /api/auth/login`
   - Body: LoginRequest
   - Retourne: 200 OK + AuthResponse
   - Erreurs: 401 Unauthorized (credentials invalides), 500 Internal Server Error

**Gestion d'erreurs**:
- `ArgumentException` → 400 Bad Request
- `UnauthorizedAccessException` → 401 Unauthorized
- Autres exceptions → 500 Internal Server Error

---

##  Base de Données

### Migration: AddUserEntity (20260102181524)

**Table Users**:
```sql
CREATE TABLE "Users" (
    "Id" uuid PRIMARY KEY,
    "Username" varchar(50) NOT NULL,
    "Email" varchar(255) NOT NULL,
    "PasswordHash" text NOT NULL,
    "CreatedAt" timestamptz NOT NULL,
    "LastLoginAt" timestamptz NULL
);

CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");
CREATE UNIQUE INDEX "IX_Users_Username" ON "Users" ("Username");
```

**Contraintes**:
- Username: max 50 caractères, unique
- Email: max 255 caractères, unique
- Timestamps avec timezone (timestamptz)

---

##  Configuration

### Program.cs - Middleware JWT

```csharp
// 1. Installation packages
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = JWT_ISSUER,
            ValidAudience = JWT_AUDIENCE,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(JWT_SECRET)
            )
        };
    });

// 2. Middleware (avant UseSwagger)
app.UseAuthentication();
app.UseAuthorization();
```

### Variables d'environnement (.env)

```bash
# JWT Configuration
JWT_SECRET=<généré avec openssl rand -base64 32>
JWT_ISSUER=TicTacToeApi
JWT_AUDIENCE=TicTacToeClient
```

---

##  Packages NuGet

### Infrastructure
- `BCrypt.Net-Next` 4.0.3 (password hashing)
- `System.IdentityModel.Tokens.Jwt` 8.15.0
- `Microsoft.IdentityModel.Tokens` 8.15.0

### Api
- `Microsoft.AspNetCore.Authentication.JwtBearer` 10.0.1

---

##  Tests Effectués

### 1. Inscription (Register)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Résultat**:  Token JWT valide retourné, utilisateur créé en DB

### 2. Connexion avec Username
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "testuser",
    "password": "password123"
  }'
```

**Résultat**:  Token JWT valide, LastLoginAt mis à jour

### 3. Connexion avec Email
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "test@example.com",
    "password": "password123"
  }'
```

**Résultat**:  Fonctionne avec email aussi

### 4. Mauvais mot de passe
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "testuser",
    "password": "wrongpassword"
  }'
```

**Résultat**:  401 Unauthorized avec message d'erreur approprié

---

##  Sécurité

### Bonnes pratiques implémentées

 **Hashing BCrypt** avec salt automatique (WorkFactor par défaut: 11)  
 **JWT signé** avec secret sécurisé (256 bits minimum)  
 **Expiration des tokens** (7 jours)  
 **Email normalisé** pour éviter doublons avec casse différente  
 **Index uniques** sur Email et Username en DB  
 **PasswordHash jamais exposé** via UserDTO  
 **Fichier .env non tracké** par git (.gitignore configuré)  
 **Validation des entrées** côté service et controller  

### Recommandations production

 **À faire avant déploiement**:
1. Générer un nouveau JWT_SECRET avec `openssl rand -base64 32`
2. Activer HTTPS uniquement (SSL Mode=Require)
3. Ajouter rate limiting sur les endpoints auth
4. Implémenter refresh tokens (optionnel)
5. Logger les tentatives de connexion échouées
6. Ajouter CAPTCHA après X échecs
7. Implémenter 2FA (optionnel)

---

##  Structure des fichiers

```
src/backend/
├── Domain/
│   └── Entities/
│       └── User.cs                     NEW
├── Application/
│   ├── DTOs/
│   │   ├── Requests/
│   │   │   ├── RegisterRequest.cs      NEW
│   │   │   └── LoginRequest.cs         NEW
│   │   └── Responses/
│   │       ├── AuthResponse.cs         NEW
│   │       └── UserDTO.cs              NEW
│   └── Mappers/
├── Infrastructure/
│   ├── Database/
│   │   ├── Configurations/
│   │   │   └── UserConfiguration.cs    NEW
│   │   ├── TicTacToeDbContext.cs       Modified (DbSet<User>)
│   │   └── TicTacToeDbContextFactory.cs  Modified
│   ├── Migrations/
│   │   └── 20260102181524_AddUserEntity.cs  NEW
│   └── Services/
│       └── AuthService.cs              NEW
└── Api/
    ├── Controllers/
    │   └── AuthController.cs           NEW
    └── Program.cs                      Modified (JWT config)
```

---

##  Prochaines étapes

### Frontend (À faire)
- [ ] Compléter LoginForm component
- [ ] Implémenter RegistrationForm component
- [ ] Stocker token dans localStorage
- [ ] Ajouter header Authorization: Bearer {token} aux appels API
- [ ] Gérer auto-login au refresh de page
- [ ] Implémenter logout (suppression token)

### Backend (À faire)
- [ ] Protéger endpoints game avec `[Authorize]`
- [ ] Extraire userId des claims JWT dans GameController
- [ ] Associer parties aux utilisateurs (Game.UserId)
- [ ] Ajouter endpoint GET /api/auth/me (profil utilisateur)
- [ ] Implémenter refresh tokens (optionnel)

### Online Features (Next branch)
- [ ] Rooms/Lobby system
- [ ] WebSockets pour temps réel
- [ ] Matchmaking

---

##  Métriques

**Lignes de code ajoutées**: ~1315  
**Fichiers créés**: 9  
**Fichiers modifiés**: 12  
**Tests manuels**: 4/4 passés   
**Temps d'implémentation**: ~2h  

---

##  Problèmes résolus

1. **Build Error CS0234**: Packages JWT manquants dans Infrastructure
   - **Solution**: Installé System.IdentityModel.Tokens.Jwt dans Infrastructure

2. **Migration échoue**: DATABASE_URL non trouvée
   - **Solution**: Créé .env avec variables DB individuelles

3. **API ne démarre pas**: DB_PASSWORD non défini
   - **Solution**: Corrigé le chemin du .env dans Program.cs (../backend/.env)

4. **Frontend .env commité**: Fichier sensible dans git
   - **Solution**: git rm --cached + .gitignore consolidé à la racine

---

##  Références

- [JWT.io](https://jwt.io/) - Décodeur et documentation JWT
- [BCrypt Calculator](https://bcrypt-generator.com/) - Tester hashing BCrypt
- [OWASP Auth Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Microsoft JWT Bearer Docs](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn)

---

**Dernière mise à jour**: 2 janvier 2026  
**Statut**:  Production-ready (après configuration des secrets en prod)
