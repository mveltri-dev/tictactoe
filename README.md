# TicTacToe – Projet de recrutement EASI

TicTacToe est un jeu de réflexion classique revisité en version web moderne : jouez en local, contre une IA ou en ligne, suivez votre progression, défiez vos amis et découvrez une interface professionnelle pensée pour le cloud et le recrutement.

👉 **Accès au jeu en ligne** : https://happy-pond-02f78f203.6.azurestaticapps.net/

---

## Qu’est-ce que ce jeu ?

TicTacToe est un jeu de stratégie à deux joueurs (X et O) sur une grille 3×3. Le but : aligner trois symboles identiques horizontalement, verticalement ou en diagonale. Cette version propose :
- Plusieurs modes de jeu (local, contre IA, multijoueur en ligne)
- Gestion des utilisateurs et authentification
- Statistiques et classement
- Interface moderne, responsive et animée

---

## Fonctionnalités principales

- **Jeu local** : affrontez un ami sur le même écran
- **Mode IA** : jouez contre l’ordinateur (stratégie évolutive)
- **Multijoueur en ligne** : parties en temps réel (SignalR)
- **Authentification JWT** : création de compte, connexion sécurisée
- **Classement pondéré** : score calculé selon victoires, nuls, défaites
- **Historique et statistiques** : suivez vos parties et votre progression
- **Interface moderne** : animations, design responsive, thèmes clair/sombre
- **Déploiement cloud-ready** : Azure Static Web Apps, CI/CD automatisé

---

## Documentation technique

La documentation complète est disponible dans `/docs` :

- [backend-architecture.md](docs/backend-architecture.md) : Clean Architecture, logique métier, SignalR
- [frontend-documentation.md](docs/frontend-documentation.md) : Atomic Design, gestion d’état, conventions UI
- [database-setup.md](docs/database-setup.md) : schéma PostgreSQL, migrations, sécurité
- [authentication-jwt.md](docs/authentication-jwt.md) : JWT, sécurité, endpoints
- [online-multiplayer-features.md](docs/online-multiplayer-features.md) : multijoueur, temps réel, rooms
- [score-system.md](docs/score-system.md) : calcul du score, classement
- [env-variables.md](docs/env-variables.md) : configuration, sécurité, exemples
- [deploiement-azure.md](docs/deploiement-azure.md) : déploiement cloud, CI/CD
- [scripts-commands.md](docs/scripts-commands.md) : commandes backend/frontend/devops
- [conventions-organisation.md](docs/conventions-organisation.md) : structure, conventions, bonnes pratiques

---

## Prérequis

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)

---

## Travail restant / améliorations prévues

- Problème SignalR en cloud (notifications/auth online)
- Authentification à finaliser en production
- Chat et rooms à implémenter
- Monitoring, tests et logs à renforcer
- UX à peaufiner

---

## Problèmes connus

- **SignalR** : notifications et authentification en ligne non fonctionnelles sur la version cloud (Azure). Le jeu fonctionne normalement en local.
- **Tests** : couverture à renforcer pour garantir la robustesse en production.

---

**Auteur : Marie Veltri**

Projet de recrutement EASI

**Dernière mise à jour : 4 janvier 2026**
