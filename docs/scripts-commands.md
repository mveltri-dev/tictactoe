# Guide Scripts & Commandes – DevOps & Qualité

## Philosophie et objectifs

La gestion centralisée des scripts et commandes garantit la reproductibilité, la rapidité et la fiabilité du projet TicTacToe. Chaque étape technique (build, migration, test, déploiement) est documentée pour faciliter l’onboarding et la maintenance.

---

## Usages et structure

- **Backend** : lancement, build, migrations, restauration
- **Frontend** : serveur dev, build, lint, formatage
- **DevOps** : déploiement Azure, CI/CD automatisé
- **Qualité** : scripts pour tests et vérifications

---

## Bonnes pratiques

- Vérifier la présence du fichier `.env` avant tout lancement
- Utiliser les scripts fournis pour éviter les erreurs
- Documenter toute nouvelle commande dans ce fichier
- Automatiser les tâches répétitives via npm ou dotnet
- Intégrer les scripts dans les pipelines CI/CD

---

## Points forts et axes d’amélioration

### Points forts
- Prise en main rapide pour tout développeur ou recruteur
- Réduction des erreurs de configuration
- Documentation claire et à jour
- Scripts adaptés à chaque environnement

### Axes d’amélioration
- Ajout de scripts pour tests unitaires et E2E
- Automatisation du monitoring et des backups
- Centralisation des logs et alertes

---

## Cohérence backend/frontend/devops

- Scripts synchronisés avec la structure du projet
- Documentation accessible et versionnée
- Intégration directe dans les guides de déploiement et d’environnement

---

## Liens utiles

- [deploiement-azure.md](deploiement-azure.md) : déploiement cloud et CI/CD
- [env-variables.md](env-variables.md) : configuration des variables
- [database-setup.md](database-setup.md) : maintenance et migrations

---

# Scripts et Commandes – Guide d’Utilisation

## Vue d’ensemble

Ce document recense tous les scripts et commandes utiles pour le projet TicTacToe, côté backend et frontend. Il permet à tout développeur de lancer, migrer, tester et déployer le projet rapidement.

---

## Backend (.NET 10)

### Lancement de l’API
```bash
cd src/backend/Api
# Démarrer l’API
 dotnet run --project Api.csproj
```

### Migrations Entity Framework
```bash
cd src/backend/Infrastructure
# Créer une migration
 dotnet ef migrations add <NomMigration> --startup-project ../Api
# Appliquer les migrations
 dotnet ef database update --startup-project ../Api
# Annuler la dernière migration
 dotnet ef database update <MigrationPrécédente> --startup-project ../Api
```

### Build et restauration
```bash
# Build complet
 dotnet build
# Restauration des packages
 dotnet restore
```

---

## Frontend (React + Vite)

### Lancement du serveur de développement
```bash
cd src/frontend
npm install
npm run dev
```

### Build de production
```bash
npm run build
```

### Linter et formatage
```bash
npm run lint
npm run format
```

---

## Déploiement Azure

- Déploiement automatique via GitHub Actions sur push des branches `main` ou `staging`
- Variables d’environnement injectées via Azure Portal
- Configuration dans `staticwebapp.config.json` (frontend)

---

## Bonnes pratiques

- Toujours vérifier la présence du fichier `.env` avant de lancer le backend
- Utiliser les scripts fournis pour éviter les erreurs de configuration
- Documenter toute nouvelle commande ou script dans ce fichier

---

**Ce guide garantit une prise en main rapide et fiable du projet pour tout développeur ou recruteur.**
