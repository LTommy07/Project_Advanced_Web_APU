# Migration Guide

## Pour les bases de données existantes

Si tu as déjà une base de données `awp_quiz` avec l'ancien schéma, suis ces étapes :

### Étape 1 : Sauvegarde ta base de données

```bash
mysqldump -u root -p awp_quiz > backup_awp_quiz_$(date +%Y%m%d).sql
```

### Étape 2 : Exécute le script de migration

```bash
mysql -u root -p awp_quiz < database/migration.sql
```

Ou manuellement dans MySQL :

```sql
source database/migration.sql;
```

### Étape 3 : Vérifie les changements

Le script affichera la structure des tables mises à jour. Vérifie que :

- ✅ `quizzes` a les colonnes `is_published` et `time_limit`
- ✅ `questions` a la colonne `points`
- ✅ `attempts` a `total_points`, `max_points`, `time_taken`
- ✅ La table `attempt_details` existe
- ✅ La colonne `taken_at` a été supprimée (si elle existait)

### Étape 4 : Redémarre l'application

```bash
npm run dev
```

## Pour une nouvelle installation

Si tu pars de zéro, utilise directement le schéma complet :

```bash
mysql -u root -p -e "CREATE DATABASE awp_quiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p awp_quiz < database/schema.sql
```

## Différences avec l'ancien schéma

### Quizzes
- ➕ `is_published` (TINYINT) - Contrôle la visibilité pour les étudiants
- ➕ `time_limit` (INT) - Limite de temps en minutes (optionnel)
- ➕ `updated_at` (TIMESTAMP) - Date de dernière modification

### Questions
- ➕ `points` (INT) - Points attribués à chaque question (défaut: 1)
- ➕ `updated_at` (TIMESTAMP) - Date de dernière modification

### Attempts
- ➕ `total_points` (INT) - Points totaux obtenus
- ➕ `max_points` (INT) - Points maximum possibles
- ➕ `time_taken` (INT) - Temps pris en secondes
- ➖ `taken_at` - Supprimé (on utilise `created_at`)

### Nouvelle table : attempt_details
- Enregistre chaque réponse individuelle
- Permet de voir question par question ce que l'étudiant a répondu
- Calcul automatique des points par question

## Rollback (en cas de problème)

Si quelque chose ne va pas, restaure la sauvegarde :

```bash
mysql -u root -p awp_quiz < backup_awp_quiz_YYYYMMDD.sql
```

## Support

En cas de problème, ouvre une issue sur GitHub avec :
- Le message d'erreur complet
- La version de MySQL utilisée
- Le schéma de ta base avant migration
