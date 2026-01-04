# Guide Déploiement Azure – Cloud & DevOps

## Philosophie et objectifs

Le déploiement du projet TicTacToe est pensé pour la simplicité, la sécurité et la scalabilité : architecture cloud-ready, CI/CD automatisé, séparation stricte des environnements et gestion centralisée des secrets. L’objectif : permettre à tout développeur ou recruteur de déployer, monitorer et maintenir le projet sans friction.

---

## Architecture cloud

- **Frontend** : Azure Static Web Apps (déploiement automatique, CDN, HTTPS)
- **Backend** : Azure App Service ou conteneur (scalabilité, monitoring)
- **Base de données** : Azure Database for PostgreSQL (sécurité, haute disponibilité)

---

## Variables d’environnement

Toutes les URLs et secrets sont injectés via Azure Portal ou GitHub Actions, jamais en dur dans le code :
- `${VITE_FRONTEND_LOCAL_URL}` / `${VITE_API_LOCAL_URL}` / `${DB_HOST}`
- `${VITE_FRONTEND_STAGING_URL}` / `${VITE_API_STAGING_URL}`
- `${VITE_FRONTEND_PROD_URL}` / `${VITE_API_PROD_URL}`

---

## Étapes de déploiement

### Frontend
- Build automatique (`npm run build`)
- Déploiement via GitHub Actions sur push `staging` ou `main`
- Configuration dans `staticwebapp.config.json`
- Variables injectées via Azure Portal

### Backend
- Build et publish (`dotnet publish -c Release`)
- Déploiement via GitHub Actions
- Variables d’environnement configurées dans Azure
- Migration des schémas avec `dotnet ef database update`

### Base de données
- Création et configuration via Azure Portal
- Sécurité renforcée (firewall, SSL, Key Vault)
- Monitoring et backup activés

---

## Différences local / staging / production

- **Local** : développement, tests manuels, base locale ou Azure
- **Staging** : QA, tests d’intégration, accès restreint, monitoring
- **Production** : haute disponibilité, logs centralisés, sécurité maximale

---

## Bonnes pratiques et axes d’amélioration

- Secrets gérés par Azure Key Vault
- Séparation stricte des environnements
- Monitoring via Application Insights
- Documentation à jour pour chaque étape
- Automatisation des backups et alertes
- Tests automatisés sur chaque pipeline

---

## Liens utiles

- [database-setup.md](database-setup.md) : configuration et sécurité base de données
- [env-variables.md](env-variables.md) : gestion des variables et secrets
- [scripts-commands.md](scripts-commands.md) : commandes de build et déploiement

---

**Dernière mise à jour : 4 janvier 2026**
