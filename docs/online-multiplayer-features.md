# Multijoueur en Ligne – Architecture et Features

## Vision et objectifs

Le mode multijoueur en ligne vise à offrir une expérience fluide, réactive et collaborative, digne d’un jeu moderne : parties en temps réel, notifications instantanées, rooms/lobby, IA évolutive, et synchronisation parfaite entre joueurs distants.

Ce module est conçu pour démontrer la maîtrise des enjeux backend (scalabilité, stockage hybride, sécurité, temps réel) et frontend (UX, animation, gestion d’état). Il s’appuie sur SignalR (WebSockets) pour la communication temps réel.

---

## Choix techniques et architecture

- **SignalR** : utilisé pour la diffusion des moves, la synchronisation des parties, et l’envoi de notifications (victoire, chat, matchmaking).
- **Stockage hybride** : parties locales en mémoire, parties online en base PostgreSQL pour performance et persistance.
- **Endpoints REST** : pour la création, le jeu contre IA, et la gestion des parties.
- **DTO enrichis** : chaque réponse API expose la ligne gagnante (`winningLine`) pour une UX avancée.

---

## Flux temps réel et synchronisation

### SignalR – GameHub

- Diffusion des moves en temps réel à tous les joueurs d’une room
- Notifications d’événements (PlayerJoined, MovePlayed, GameEnded)
- Prêt pour l’ajout du chat et du lobby
- Gestion des rooms et du matchmaking en cours d’implémentation

### Exemple de flux multijoueur

1. Joueur 1 crée une partie online (POST `/api/game`, mode `VsPlayerOnline`)
2. Joueur 2 rejoint la room via SignalR
3. Chaque move est diffusé instantanément à l’autre joueur
4. Fin de partie : notification et animation frontend

---

## Stockage hybride – Performance et scalabilité

- Parties locales (VsPlayer, VsAI) : stockées en mémoire pour rapidité
- Parties online (VsPlayerOnline) : stockées en base pour persistance et multi-device
- Règles claires pour chaque mode, API unifiée
- Prêt pour extension Redis ou session storage côté client

---

## IA et endpoints dédiés

- Endpoint `/api/game/{id}/ai-move` : le backend joue le coup IA en un seul appel
- Algorithme IA actuel : aléatoire, prêt pour Minimax et stratégies avancées
- Validation stricte des modes et statuts de partie

---

## Sécurité, thread safety et limitations

- Authentification JWT pour les endpoints online
- CORS configuré pour limiter les origines
- Stockage mémoire : attention aux race conditions (thread safety à renforcer)
- Parties locales : non persistées, perdues au redémarrage serveur
- Monitoring et logs à améliorer pour production

---

## Points forts et axes d’amélioration

### Points forts
- Expérience multijoueur réactive grâce à SignalR
- Animation frontend facilitée par l’exposition de la ligne gagnante
- Stockage optimisé selon le mode de jeu
- API claire, rétrocompatible, prête pour extension

### Axes d’amélioration
- Finaliser rooms/lobby et matchmaking
- Améliorer l’IA (Minimax, niveaux de difficulté)
- Sécuriser le stockage mémoire (thread safety, cleanup)
- Implémenter le chat et les statistiques utilisateur
- Monitoring, logs et tests à renforcer

---

## Liens et documentation associée

- [backend-architecture.md](backend-architecture.md) : structure et logique backend
- [env-variables.md](env-variables.md) : configuration et variables d’environnement
- [score-system.md](score-system.md) : gestion du scoring et statistiques

---

## Dernière mise à jour

**4 janvier 2026** 