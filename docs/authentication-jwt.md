# Authentification JWT – Documentation complète

## Philosophie et choix de sécurité

Le projet TicTacToe adopte une approche moderne et robuste de l’authentification : JWT pour la gestion des sessions, BCrypt pour le hashing des mots de passe, validation stricte des entrées et séparation claire des responsabilités. L’objectif : garantir la sécurité, la scalabilité et la simplicité d’intégration frontend/backend.

---

## Flux d’authentification

1. **Inscription** : l’utilisateur crée un compte (username, email, mot de passe)
   - Mot de passe hashé avec BCrypt (salt automatique)
   - Email et username uniques, normalisés
   - Création en base, retour d’un token JWT
2. **Connexion** : login par email ou username
   - Vérification du mot de passe (BCrypt)
   - Mise à jour du dernier login
   - Génération d’un nouveau JWT
3. **Utilisation du token** : le frontend stocke le JWT (localStorage)
   - Ajout du header Authorization: Bearer {token} à chaque appel API protégé
   - Extraction des claims côté backend pour sécuriser les endpoints

---

## Architecture technique

- **Domain** : entité User, validations, tracking des sessions
- **Application** : DTOs pour requests/responses, mapping sécurisé
- **Infrastructure** : AuthService (inscription, login, génération JWT), configuration des clés et algorithmes
- **Api** : AuthController, endpoints REST, gestion des erreurs

---

## Sécurité et bonnes pratiques

- Hashing BCrypt avec salt et work factor
- JWT signé (HS256, secret 256 bits minimum)
- Expiration des tokens (7 jours)
- PasswordHash jamais exposé
- Email/username uniques et normalisés
- Variables sensibles dans .env, jamais commitées
- Validation stricte des entrées et gestion des erreurs

### Recommandations production

- Générer un JWT_SECRET fort avant déploiement
- Activer HTTPS et SSL obligatoire
- Ajouter rate limiting et CAPTCHA sur endpoints auth
- Implémenter refresh tokens et 2FA si besoin
- Logger les tentatives échouées
- Auditer la sécurité avant mise en production

---

## Cohérence frontend/backend

- LoginForm et RegistrationForm côté frontend
- Stockage du token en localStorage
- Auto-login au refresh, logout sécurisé
- Header Authorization ajouté automatiquement
- Endpoints protégés par `[Authorize]` côté backend

---

## Axes d’amélioration et extensions possibles

- Refresh tokens pour sessions longues
- 2FA (authentification à deux facteurs)
- Rate limiting et monitoring avancé
- Association des parties aux utilisateurs (Game.UserId)
- Endpoint profil utilisateur GET /api/auth/me

---

## Liens utiles

- [backend-architecture.md](backend-architecture.md) : structure backend et sécurité
- [env-variables.md](env-variables.md) : configuration des secrets
- [online-multiplayer-features.md](online-multiplayer-features.md) : sécurité en multijoueur

---

**Dernière mise à jour : 4 janvier 2026**