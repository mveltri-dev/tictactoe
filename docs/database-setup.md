# Documentation Configuration Base de Données – PostgreSQL & Azure

## Philosophie et objectifs

La configuration de la base de données vise la sécurité, la scalabilité et la simplicité d’administration : PostgreSQL 16 hébergé sur Azure, Entity Framework Core pour l’ORM, schéma optimisé pour le jeu en ligne et la gestion des utilisateurs. Chaque choix technique facilite le déploiement cloud, la maintenance et l’évolution du projet.

---

##  Vue d'ensemble

Configuration PostgreSQL hébergée sur Azure avec Entity Framework Core.

**Base de données**: PostgreSQL 16  
**ORM**: Entity Framework Core 10.0  
**Provider**: Npgsql 9.0.2  
**Hébergement**: Azure Database for PostgreSQL 

---
 
## Schéma et organisation

- **Games** : parties, board, statut, mode, ligne gagnante
- **Players** : joueurs, symboles, type (humain/IA), nom
- **Users** : comptes, email, username, password hash, tracking login
- **Relations** : foreign keys, cascade delete, indexes pour performance
- **JSONB** : stockage flexible pour board et winningLine

---

## Migrations et commandes

- Génération et application des migrations via Entity Framework Core
- Rollback, suppression, script SQL pour audit et déploiement
- Vérification connexion, logs et troubleshooting intégrés

---

## Sécurité et bonnes pratiques

- Connexion SSL obligatoire (Azure)
- Variables sensibles dans .env, jamais commitées
- .env.example pour documentation
- Azure Key Vault recommandé en production
- Firewall restrictif, accès IP limité
- Passwords jamais en clair, hashing côté backend

---

## Points forts et axes d’amélioration

### Points forts
- Schéma optimisé pour queries récentes et joins
- Index sur colonnes critiques (CreatedAt, Email, Username)
- Cascade delete pour intégrité des données
- Mapping .NET → PostgreSQL cohérent
- Commandes de maintenance claires et documentées

### Axes d’amélioration
- Partitioning et read replicas pour scalabilité
- Monitoring et alertes avancés
- Index supplémentaires sur status et relations
- Automatisation backup et rollback

---

## Cohérence backend/devops

- Configuration centralisée dans Infrastructure
- Migrations versionnées et traçables
- Checklist déploiement pour production
- Monitoring et logs intégrés Azure

---

## Liens utiles

- [backend-architecture.md](backend-architecture.md) : logique backend et accès DB
- [env-variables.md](env-variables.md) : configuration des secrets et accès
- [deploiement-azure.md](deploiement-azure.md) : déploiement cloud et sécurité

---

**Dernière mise à jour : 4 janvier 2026**