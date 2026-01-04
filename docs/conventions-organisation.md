# Guide Organisation & Conventions – Cohérence & Maintenabilité

## Philosophie et objectifs

L’organisation du projet et le respect des conventions garantissent la maintenabilité, la lisibilité et la facilité d’onboarding pour tout développeur ou recruteur. Chaque choix structurel vise la clarté, la scalabilité et la cohérence sur le long terme.

---

## Structure des dossiers

- **Backend** : séparation Domain, Application, Infrastructure, Api (Clean Architecture)
- **Frontend** : Atomic Design, hooks, services, pages, templates
- **Public** : assets statiques, configuration
- **Docs** : documentation technique par sujet

---

## Conventions de nommage et organisation

- PascalCase pour composants et types
- camelCase pour hooks et fonctions
- kebab-case pour CSS Modules
- Dossiers singuliers pour entités, pluriels pour collections
- Un composant = un dossier dédié (tsx, style, index)
- Imports propres via alias `@/`
- Export groupé via index.ts

---

## Conventions Git et documentation

- Branches principales : `main`, `develop`, `staging`
- Branches features/fix/refactor bien nommées
- Commits clairs et descriptifs
- Jamais de secrets ou `.env` dans le repo
- README central, non surchargé
- Un fichier Markdown par sujet technique dans `/docs`
- Toute nouvelle convention doit être documentée ici

---

## Points forts et axes d’amélioration

### Points forts
- Cohérence et lisibilité pour toute l’équipe
- Onboarding rapide pour nouveaux développeurs
- Documentation accessible et à jour
- Structure scalable et adaptée à la croissance

### Axes d’amélioration
- Ajout de conventions pour les tests et le monitoring
- Documentation des workflows CI/CD
- Centralisation des conventions frontend/backend

---

## Liens utiles

- [frontend-documentation.md](frontend-documentation.md) : conventions UI et Atomic Design
- [backend-architecture.md](backend-architecture.md) : organisation Clean Architecture
- [scripts-commands.md](scripts-commands.md) : conventions de scripts et automatisation

---

**Dernière mise à jour : 4 janvier 2026**

---

## Vue d’ensemble

Ce document détaille l’organisation des dossiers, la structure du code et les conventions adoptées pour garantir la maintenabilité et la lisibilité du projet TicTacToe.

---

## Structure des dossiers

```
src/
├── backend/
│   ├── Domain/          # Entités métier, enums
│   ├── Application/     # DTOs, logique applicative
│   ├── Infrastructure/  # DB, services, migrations
│   └── Api/             # Controllers REST
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── atoms/
    │   │   ├── molecules/
    │   │   ├── organisms/
    │   │   └── templates/
    │   ├── pages/
    │   ├── hooks/
    │   └── services/
    ├── public/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── postcss.config.js
```

---

## Conventions de nommage

- **Composants React** : PascalCase (GameBoard.tsx)
- **Hooks** : camelCase avec préfixe use (useGame.ts)
- **CSS Modules** : kebab-case (.button-primary)
- **Types/DTOs** : PascalCase (GameDTO, Symbol)
- **Dossiers** : singulier pour les entités, pluriel pour les collections

---

## Organisation des fichiers

- Un composant = un dossier dédié avec :
  - Composant principal (.tsx)
  - Fichier de style (.module.css)
  - index.ts (export)
- Export groupé via index.ts dans chaque dossier
- Import propre via alias `@/` (Vite)

---

## Conventions Git

- Branches principales : `main`, `develop`, `staging`
- Branches features : `feature/<nom>`, `fix/<nom>`, `refactor/<nom>`
- Commits clairs et descriptifs
- Pas de commit de fichiers `.env` ou secrets

---

## Documentation

- README central, non surchargé
- Un fichier Markdown par sujet technique dans `/docs`
- Toute nouvelle convention ou organisation doit être documentée ici

---

## Points forts et axes d’amélioration

### Points forts
- Cohérence et lisibilité pour toute l’équipe
- Onboarding rapide pour nouveaux développeurs
- Documentation accessible et à jour
- Structure scalable et adaptée à la croissance

### Axes d’amélioration
- Ajout de conventions pour les tests et le monitoring
- Documentation des workflows CI/CD
- Centralisation des conventions frontend/backend

---

## Liens utiles

- [frontend-documentation.md](frontend-documentation.md) : conventions UI et Atomic Design
- [backend-architecture.md](backend-architecture.md) : organisation Clean Architecture
- [scripts-commands.md](scripts-commands.md) : conventions de scripts et automatisation

---

**Ce guide garantit la cohérence et la maintenabilité du projet pour toute équipe ou recruteur.**

**Dernière mise à jour : 4 janvier 2026**
