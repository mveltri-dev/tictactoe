# Système de Score Pondéré

## Vue d'ensemble

Le système de classement utilise un **score pondéré** au lieu d'un système ELO traditionnel. Ce système est plus simple et transparent pour les joueurs.

## Philosophie et choix du scoring

Le projet TicTacToe privilégie un système de score pondéré, simple et transparent, pour valoriser l’engagement et la progression des joueurs. Contrairement à l’ELO, ce système est immédiatement compréhensible et encourage la participation, tout en restant juste et motivant.

---

## Formule de Calcul

```
Score = (Victoires × 3) + (Matchs Nuls × 1) - (Défaites × 1)
```

- Les victoires sont fortement valorisées
- Les matchs nuls encouragent la persévérance
- Les défaites pénalisent modérément, sans décourager

### Exemples

- **Joueur A** : 28 victoires, 10 défaites, 4 nuls
  - Score = (28 × 3) + (4 × 1) - (10 × 1) = 84 + 4 - 10 = **78 points**

- **Joueur B** : 10 victoires, 5 défaites, 0 nul
  - Score = (10 × 3) + (0 × 1) - (5 × 1) = 30 + 0 - 5 = **25 points**

- **Joueur C** : 5 victoires, 8 défaites, 3 nuls
  - Score = (5 × 3) + (3 × 1) - (8 × 1) = 15 + 3 - 8 = **10 points**

---

## Classement et égalités

Le classement général est basé sur le score pondéré :
1. Score le plus élevé
2. Taux de victoire en cas d’égalité
3. Nombre total de victoires si égalité persistante

---

## Valeurs Initiales

Chaque nouveau joueur commence avec :
- 0 victoire
- 0 défaite
- 0 match nul
- **Score = 0**

## Implémentation Technique

### Backend (C#)

**Fichier**: `src/backend/Api/Controllers/UserController.cs`

Le calcul du score est effectué dans l'endpoint `/api/user/stats` :

```csharp
var score = (wins * 3) + (draws * 1) - (losses * 1);
```

Le rang est calculé en comparant le score du joueur avec tous les autres joueurs :

```csharp
var rank = userScores.OrderByDescending(x => x.score).ToList()
    .FindIndex(x => x.userId == userGuid) + 1;
```

### Frontend (TypeScript/React)

**Interface TypeScript** (`src/frontend/src/services/userService.ts`) :

```typescript
interface UserStats {
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  winRate: number
  score: number  // Score pondéré
  rank: number   // Rang basé sur le score
}
```

**Affichage** (`src/frontend/src/components/organisms/OnlineHub.tsx`) :

Le dashboard affiche :
- Le score principal en évidence
- Le rang du joueur
- Les statistiques détaillées (victoires, parties, taux de victoire)
- L'explication de la formule : "Score = (Victoires × 3) + (Nuls × 1) - (Défaites × 1)"

---

## Avantages du Système

- **Simplicité** : accessible à tous
- **Transparence** : chaque joueur comprend son score
- **Valorisation** : les victoires sont récompensées
- **Motivation** : même les nuls rapportent des points
- **Équité** : défaites peu punitives, encourage à rejouer

---

## Fonctionnalités associées

- Matchmaking et invitation d’amis
- Dashboard personnel et classement global
- Statistiques détaillées pour chaque joueur
- Profil personnalisable (avatar, bio, stats)
- Design responsive et animations fluides

---

## Implémentation technique

### Backend (.NET 10)
- Calcul du score dans l’endpoint `/api/user/stats`
- Classement dynamique via tri des scores
- Statistiques exposées dans l’API (DTO UserStats)

### Frontend (React/TypeScript)
- Dashboard affichant score, rang, stats détaillées
- Explication de la formule directement dans l’UI
- Composants réutilisables pour leaderboard et profil

---

## Axes d’amélioration et extensions possibles

- Passage à un système ELO pour les parties classées
- Ajout de badges et succès pour milestones
- Leaderboard avancé : filtres, historique, stats par mode
- Statistiques temps réel via SignalR
- Export des stats pour analyse externe

---

## Liens utiles

- [backend-architecture.md](backend-architecture.md) : logique backend et scoring
- [online-multiplayer-features.md](online-multiplayer-features.md) : scoring en multijoueur
- [conventions-organisation.md](conventions-organisation.md) : organisation des composants UI

---

**Dernière mise à jour : 4 janvier 2026**
