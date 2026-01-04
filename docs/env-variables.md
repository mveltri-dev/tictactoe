# Documentation Variables d’Environnement – Sécurité & Cloud

## Philosophie et objectifs

La gestion des variables d’environnement est centrale pour la sécurité, la portabilité et le déploiement cloud du projet TicTacToe. Chaque secret ou paramètre technique doit être isolé du code, versionné dans un template, et géré par l’infrastructure (Azure, CI/CD).

---

## Usages et structure

- **Backend** : configuration DB, JWT, ports
- **Frontend** : URLs API, mode debug
- **DevOps** : injection automatique via Azure ou GitHub Actions
- **Sécurité** : jamais de secrets en dur, rotation possible

---

## Bonnes pratiques

- Ne jamais commiter le vrai fichier `.env`
- Utiliser `.env.example` pour documenter les variables
- Changer la clé JWT en production
- Valider la présence de chaque variable au démarrage
- Centraliser la gestion des secrets via Azure Key Vault
- Documenter chaque nouvelle variable dans ce fichier

---

## Points forts et axes d’amélioration

### Points forts
- Séparation stricte des environnements (local, staging, prod)
- Sécurité renforcée par Azure et CI/CD
- Documentation claire et à jour
- Validation automatique dans Program.cs

### Axes d’amélioration
- Ajout de variables pour le logging, le monitoring, le mode debug
- Automatisation de la rotation des secrets
- Monitoring des accès et alertes sur changements

---

## Cohérence backend/devops

- Variables utilisées dans tous les services critiques
- Configuration centralisée et versionnée
- Documentation accessible à tout développeur ou recruteur

---

## Liens utiles

- [database-setup.md](database-setup.md) : configuration et sécurité base de données
- [deploiement-azure.md](deploiement-azure.md) : gestion des secrets et variables en cloud
- [authentication-jwt.md](authentication-jwt.md) : configuration JWT et sécurité

---

**Dernière mise à jour : 4 janvier 2026**
