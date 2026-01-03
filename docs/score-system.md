# Système de Score Pondéré

## Vue d'ensemble

Le système de classement utilise un **score pondéré** au lieu d'un système ELO traditionnel. Ce système est plus simple et transparent pour les joueurs.

## Formule de Calcul

```
Score = (Victoires × 3) + (Matchs Nuls × 1) - (Défaites × 1)
```

### Exemples

- **Joueur A** : 28 victoires, 10 défaites, 4 nuls
  - Score = (28 × 3) + (4 × 1) - (10 × 1) = 84 + 4 - 10 = **78 points**

- **Joueur B** : 10 victoires, 5 défaites, 0 nul
  - Score = (10 × 3) + (0 × 1) - (5 × 1) = 30 + 0 - 5 = **25 points**

- **Joueur C** : 5 victoires, 8 défaites, 3 nuls
  - Score = (5 × 3) + (3 × 1) - (8 × 1) = 15 + 3 - 8 = **10 points**

## Classement

Le classement est basé sur le **score** du plus élevé au plus bas. En cas d'égalité :
1. Le joueur avec le meilleur **taux de victoire** est classé premier
2. Si encore égalité, le joueur avec le plus de **victoires totales** est classé premier

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

## Avantages du Système

1. **Simplicité** : Facile à comprendre et à calculer
2. **Transparence** : Les joueurs comprennent exactement comment leur score est calculé
3. **Valorisation des victoires** : Les victoires valent 3 fois plus qu'un nul
4. **Pénalité modérée** : Les défaites retirent 1 point (pas trop punitif)
5. **Encouragement à jouer** : Même les nuls ajoutent 1 point

## Fonctionnalités par Onglet

### 1. Trouver une partie
- **Jouer contre un ami** : Liste de tous les amis disponibles, possibilité d'inviter
- **Jouer en ligne** : Matchmaking automatique avec un joueur connecté

### 2. Gérer mes amis
- Liste complète des amis avec leur dashboard
- Recherche d'amis par username
- Consultation des statistiques de chaque ami

### 3. Classement
- Tableau de classement basé sur le score pondéré
- Affichage du rang et du score de tous les joueurs
- Triage par score décroissant, puis par taux de victoire

### 4. Modifier mon profil
- Avatar personnalisable
- Pseudo unique
- Email
- Âge
- Biographie
- Consultation des statistiques personnelles (victoires, défaites, parties, taux de victoire, score)

## Interface Utilisateur

L'interface suit strictement le style de V0 :
- Couleurs et thèmes identiques
- Mise en page fidèle
- Composants réutilisables (cards, boutons, grilles)
- Animations et transitions fluides
- Design responsive (mobile et desktop)
