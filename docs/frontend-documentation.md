# Frontend - React + TypeScript Documentation

## Étape 5 : Architecture Frontend

### 5.1 : Stack Technique

**Technologies principales** :

- **React 18.3.1** : Bibliothèque UI avec hooks modernes
- **TypeScript 5.9.3** : Typage statique pour éviter les erreurs
- **Vite 5.4.21** : Build tool ultra-rapide (HMR en <100ms)
- **React Router 7.11.0** : Routing côté client
- **Framer Motion 12.23.26** : Animations fluides
- **Lucide React 0.562** : Icônes SVG optimisées
- **clsx 2.1.1** : Utilitaire pour classes CSS conditionnelles

**Pourquoi ces choix ?**

 **Vite vs Create React App** : Build 10x plus rapide, ESM natif
 **TypeScript** : Détection d'erreurs à la compilation, autocomplétion
 **Framer Motion** : Animations déclaratives, spring physics naturelles
 **CSS Modules** : Isolation des styles, pas de conflits de noms

---

### 5.2 : Architecture Atomic Design

**Principe** : Organisation des composants en 5 niveaux hiérarchiques

```
atoms/          → Composants de base non décomposables
molecules/      → Combinaison d'atoms simples
organisms/      → Sections complexes avec logique métier
templates/      → Layout et structure de page
pages/          → Pages complètes avec données

```

**Avantages** :

 **Réutilisabilité maximale** : Atoms utilisés partout
 **Maintenabilité** : Changement atom = propagation automatique
 **Testabilité** : Chaque niveau testable isolément
 **Scalabilité** : Ajout de features sans refactoring

---

### 5.3 : Composants Atoms (7 composants)

**Philosophie** : Composants unitaires, pas de dépendances entre eux

**1. Button** - Bouton générique réutilisable
- Variants : primary, secondary, destructive
- States : default, hover, disabled
- Framer Motion : scale + opacity sur hover

**2. IconX** - Symbole X animé
- SVG path avec strokeDashoffset animation
- Transition fluide 0.3s

**3. IconO** - Symbole O animé
- Cercle SVG avec scale spring animation
- Framer Motion variants

**4. ScoreBadge** - Badge de score
- Variants : x (violet), o (rose), draw (neutre)
- Label + valeur numérique
- CSS Modules avec variables HSL

**5. CellMark** - Marque dans une cellule
- Affiche X ou O selon le symbole
- Animation d'apparition scale + rotate
- Exit animation pour restart

**6. GameButton** - Bouton de jeu
- Icône + texte
- Hover effect avec glow
- Variantes : restart, new game

**7. ThemeToggle** - Switch light/dark mode
- Sun/Moon icons (Lucide)
- Animation de rotation 180°
- Persist dans localStorage

---

### 5.4 : Composants Molecules (8 composants)

**Philosophie** : Combinaison d'atoms avec logique simple

**1. GameCell** - Cellule du plateau
- Composition : Button + CellMark
- Props : position, value, onClick, disabled, isWinning
- Animation glow vert sur winning line
- Hover effect seulement si cliquable

**2. PlayerCard** - Carte joueur
- Affiche nom + symbole
- Highlight si c'est son tour
- Pulse animation quand actif
- Composition : IconX/IconO + texte

**3. GameStatus** - Statut de la partie
- Affiche : "Tour de X", "X gagne !", "Match nul"
- Animation slide in from top
- Couleur adaptée au contexte

**4. PlayerNamesInput** - Formulaire de saisie
- 2 inputs avec validation
- Label + icône User (Lucide)
- maxLength: 20 caractères
- showPlayer2 conditionnel (mode IA)

**5. GameControls** - Boutons de contrôle
- "Nouvelle partie" + "Recommencer"
- Composition : 2 GameButton
- Layout flex avec gap

**6. ScorePanel** - Panneau des scores
- 3 ScoreBadge : X, Nuls, O
- Layout horizontal avec gap
- Animation fade in

**7. StatusDisplay** - Affichage riche du statut
- Inclut GameStatus
- Icônes contextuelles (Trophy, Brain, Loader)
- Messages adaptés : "IA réfléchit...", "Vous avez gagné !"

**8. LoginForm** - Modal de connexion
- Formulaire email + password (futur)
- Overlay blur avec AnimatePresence
- Fermeture par backdrop click ou X

---

### 5.5 : Composants Organisms (6 composants)

**Philosophie** : Sections complètes avec logique métier

**1. GameBoard** - Plateau de jeu 3×3
- Grid CSS 3 colonnes
- Map des 9 cellules
- Gère les clicks et l'état disabled
- Animation stagger sur les cellules

**2. GameConfiguration** - Page de configuration
- Choix du symbole (X ou O)
- Saisie des noms (conditionnel selon mode)
- Bouton "Commencer"
- Validation : nom requis si visible

**3. GamePlaying** - Page de jeu en cours
- Composition :
  - ScorePanel (top)
  - PlayerCard × 2 (gauche/droite)
  - GameBoard (centre)
  - StatusDisplay (sous le board)
  - GameControls (bottom)
- Gestion état loading (spinner)
- Attribution correcte des scores selon chosenSymbol

**4. GameModeSelector** - Sélecteur de mode
- 3 modes : vs IA, vs Local, vs En ligne
- Icônes : Bot, Users, Globe
- Badge "Pro" sur mode online
- onClick : LoginForm si pas connecté

**5. GameHeader** - En-tête de l'app
- Logo + titre
- ThemeToggle
- Layout flex space-between

**6. SettingsMenu** - Menu de paramètres
- Toggle son
- Sélecteur de langue
- Layout vertical avec sections

---

### 5.6 : Template GameLayout

**Rôle** : Structure globale de toutes les pages

**Structure** :
```
<header> GameHeader
<main>
  <children> Contenu dynamique (router)
<aside> SettingsMenu
```

**Caractéristiques** :
- Layout responsive
- Props : isSoundEnabled, language, onSoundToggle, onLanguageChange
- Thème appliqué via ThemeProvider
- Padding et max-width pour lisibilité

---

### 5.7 : CSS Modules - Remplacement de Tailwind

**Décision technique** : Supprimer Tailwind CSS

**Pourquoi ?**
-  Tailwind = 54 packages supplémentaires
-  Build time plus long
-  Classes utilitaires illisibles (className="flex flex-col items-center...")
-  Pas de vraie isolation des styles

**Solution adoptée : CSS Modules**
-  Fichier .module.css par composant
-  Isolation automatique (hash des noms)
-  CSS pur, performances optimales
-  Pas de dépendances externes
-  Bundle -25 KB JS, -6 KB CSS

**Système de variables CSS** :
```css
:root {
  --background: 240 5% 99%;
  --primary: 240 60% 50%;
  --game-x: 280 70% 60%;
  --game-o: 340 65% 58%;
}
```

**Thème dark** :
```css
.dark {
  --background: 270 50% 11%;
  --primary: 280 75% 62%;
}
```

**Format HSL** : Permet l'alpha channel `hsl(var(--primary) / 0.5)`

**Inspiration design** : Couleurs easi.net (bleus, violets)

---

### 5.8 : State Management avec useGame

**Philosophie** : Pas de Redux, custom hook suffit

**État géré** :
- `game: GameDTO | null` - Partie en cours
- `config: GameConfig` - Configuration (noms, symbole, mode)
- `appState: AppState` - État UI (configuration, loading, playing, finished, error)
- `scores: Scores` - Scores cumulés (X, O, draws)
- `error: string | null` - Message d'erreur

**Actions** :
- `createGame()` - Créer nouvelle partie (async)
- `makeMove()` - Jouer un coup avec délai IA (async)
- `resetGame()` - Retour à la configuration
- `updateConfig()` - Modifier config (noms, symbole)
- `changeGameMode()` - Changer de mode

**Auto-restart** :
- useEffect détecte fin de partie
- Attend 2 secondes
- Crée automatiquement nouvelle partie avec même config
- Permet les parties rapides successives

**Gestion scores** :
- Incrémentation par symbole (X, O, draws)
- previousGameStatusRef évite double comptage
- Reset lors de resetGame()

**Gestion IA** :
- Délai 1200ms avant coup IA (UX)
- Appel api.playAiMove() séparé
- Console.log pour debug timing

---

### 5.9 : Routing avec React Router

**Structure des routes** :

```
/                 → Configuration (GameConfiguration)
/game/:id         → Jeu en cours (GamePlaying)
```

**Navigation** :
- `useNavigate()` pour redirection programmatique
- Après création partie : navigate(`/game/${newGame.id}`)
- Bouton "Nouvelle partie" : navigate('/')

**Gestion erreurs** :
- Partie introuvable (404) : Message + bouton retour
- État error : Affichage message + actions

**BrowserRouter** :
- Configuré dans main.tsx
- Enveloppe toute l'application
- Permet liens navigables

---

### 5.10 : Intégration API

**Service API** : `src/services/api.ts`

**Configuration URL** :
```typescript
const BASE_URL = import.meta.env.VITE_API_LOCAL_URL || 
                 import.meta.env.VITE_API_AZURE_URL
```

**Priorité** : LOCAL → AZURE (facilite développement)

**Méthodes** :
- `createGame(request)` - POST /api/game
- `getGame(id)` - GET /api/game/{id}
- `makeMove(request)` - POST /api/game/{id}/moves
- `playAiMove(gameId)` - POST /api/game/{id}/ai-move

**Gestion erreurs** :
- Fetch avec try/catch
- Parse erreur JSON si disponible
- Console.log pour debugging
- Throw Error avec message explicite

**Headers** :
- Content-Type: application/json
- Pas d'auth pour l'instant (v1)

---

### 5.11 : Theme System

**ThemeProvider** : Context React pour le thème

**Features** :
- Toggle light/dark mode
- Persist dans localStorage
- data-theme attribute sur <html>
- .dark class pour compatibilité

**Hook useTheme()** :
```typescript
const { theme, toggleTheme, setTheme } = useTheme()
```

**Application** :
- Variables CSS adaptées au thème
- Smooth transition 0.3s
- Pas de flash lors du chargement

---

### 5.12 : TypeScript - DTOs et Types

**Enums** :
- Symbol : "X" | "O"
- GameModeAPI : "VsComputer" | "VsPlayerLocal" | "VsPlayerOnline"
- GameMode : "ai" | "local" | "friend" (UI)
- GameStatus : "InProgress" | "XWins" | "OWins" | "Draw"
- AppState : "configuration" | "loading" | "playing" | "finished" | "error"

**Request DTOs** :
- CreateGameRequest : player1Name, player2Name?, chosenSymbol, gameMode
- MakeMoveRequest : gameId, playerId, position

**Response DTOs** :
- GameDTO : id, board, playerXId, playerOId, currentTurn, status, winnerId, winningLine, createdAt, mode
- PlayerDTO : id, name, symbol

**Bénéfices TypeScript** :
- Autocomplétion dans VSCode
- Erreurs à la compilation (pas au runtime)
- Refactoring sûr
- Documentation inline

---

### 5.13 : Build et Configuration

**Vite Config** :
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: { port: 5173 }
})
```

**TypeScript Config** :
- target: ES2022 (features modernes)
- moduleResolution: bundler (Vite-friendly)
- paths: { "@/*": ["./src/*"] } (imports propres)
- strict: true (typage strict)

**PostCSS** :
- autoprefixer (compatibilité navigateurs)
- Pas de Tailwind

**Package.json** :
- type: "module" (ESM natif)
- 15 dependencies (vs 69 avec Tailwind)

**Bundle sizes** :
- JS : 334.28 KB
- CSS : 21.13 KB
- Total : ~355 KB (gzipped ~100 KB)

---

### 5.14 : Problèmes Résolus

**1. Page blanche après Tailwind removal**
- Cause : App.tsx utilisait classes Tailwind
- Solution : Créer App.module.css, convertir toutes les classes
- Leçon : Convertir TOUS les composants, pas seulement Atomic Design

**2. Scores comptés en double**
- Cause : useEffect déclenché 2× (player move + AI move)
- Solution : previousGameStatusRef pour tracker changements
- Incrémente seulement si statut passe de "InProgress" à terminé

**3. Scores attribués au mauvais joueur**
- Cause : scores.X hardcodé pour joueur 1
- Solution : Mapper selon config.chosenSymbol
- Si user joue O : user = scores.O, EasiBot = scores.X

**4. Erreur API 404 sur coup IA**
- Cause : game.id stale après makeMove
- Solution : Utiliser updatedGame.id (frais)
- Importance : Closures JavaScript

**5. Erreur TypeScript "Cannot find module 'path'"**
- Cause : __dirname non disponible en ESM
- Solution : fileURLToPath(new URL()) + @types/node

**6. setTimeout type mismatch**
- Cause : Node.js vs Browser Timeout types
- Solution : ReturnType<typeof setTimeout>

---

### 5.15 : Animations Framer Motion

**Patterns utilisés** :

**1. Fade + Slide**
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4 }}
```

**2. Scale Spring**
```typescript
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
transition={{ type: "spring", stiffness: 400 }}
```

**3. Stagger Children**
```typescript
variants={containerVariants}
<motion.div variants={itemVariants}>
```

**4. Exit Animations**
```typescript
<AnimatePresence>
  {condition && <Component exit={{ opacity: 0 }} />}
</AnimatePresence>
```

**Principe** : Animations déclaratives, pas d'état manuel

---

### 5.16 : Conventions de Code

**Naming** :
- Composants : PascalCase (GameBoard.tsx)
- Hooks : camelCase avec préfixe use (useGame.ts)
- CSS Modules : kebab-case (.button-primary)
- Types : PascalCase (GameDTO, Symbol)

**Structure fichiers** :
```
ComponentName/
  ComponentName.tsx
  ComponentName.module.css
  index.ts (export)
```

**Imports** :
- React types : `import type React from "react"`
- Types locaux : `import type { GameDTO } from "../dtos"`
- Composants : `import { Button } from "@/components/atoms"`

**Exports** :
- index.ts dans chaque dossier
- Export groupé : `export { Button } from "./Button/Button"`
- Import depuis niveau supérieur : `import { Button, IconX } from "@/components/atoms"`

---

### 5.17 : Prochaines Étapes

**Fonctionnalités à implémenter** :

 **Multijoueur en ligne** (branche feature/online-multiplayer)
- WebSockets pour temps réel
- Système de rooms/lobby
- Matching de joueurs
- Chat en jeu

 **Authentification**
- Système de comptes utilisateurs
- Historique des parties
- Classement ELO
- Statistiques personnelles

 **Progressive Web App**
- Service Worker
- Cache offline
- Installable sur mobile
- Notifications push

 **Internationalisation**
- Support multi-langues
- Français, Anglais, Espagnol
- Format dates/heures localisé

 **Tests**
- Unit tests (Vitest)
- Component tests (Testing Library)
- E2E tests (Playwright)
- Coverage >80%

---

## Récapitulatif Frontend 

**Architecture** : Atomic Design + CSS Modules
**Stack** : React 18 + TypeScript + Vite
**State** : Custom hooks (useGame, useTheme)
**Routing** : React Router 7
**Animations** : Framer Motion
**Styling** : CSS Modules + variables HSL
**Bundle** : 355 KB (optimisé)

**Commits** : 8 commits organisés
1. DTOs et API service
2. Theme context et utilities
3. useGame hook
4. App + routing
5. CSS refactor (Tailwind removal)
6. Build config
7. Fix attribution scores
8. Fix double comptage

**Temps de développement** : ~6h (Atomic Design + intégration)
**Performance** : HMR <100ms, Build <2s

---

## Prochaine étape : Multijoueur en ligne 
