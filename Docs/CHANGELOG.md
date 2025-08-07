# Changelog - Journey App

## [2.5.0] - 2025-08-07

### 🔐 SYSTÈME WHITELIST - NOUVEAUTÉ MAJEURE
- **Sécurité renforcée** : Seuls les agents préalablement autorisés peuvent s'inscrire
- **Protection RGPD** : Données personnelles hachées SHA-256 avec sel configurable
- **Interface admin complète** : Gestion whitelist intégrée à l'espace administration
- **Import automatisé** : Scripts PHP pour import CSV et Excel en lot
- **Validation renforcée** : Vérification code personnel + nom/prénom lors de l'inscription

### 📊 Fonctionnalités Whitelist
- **Ajout manuel** : Interface web pour ajouter des agents individuellement
- **Import CSV/Excel** : Scripts `import_whitelist_csv.php` et `import_whitelist_excel.php`
- **Recherche avancée** : Filtrage par code personnel, nom, prénom et statut
- **Activation/Désactivation** : Contrôle des autorisations sans suppression de données
- **Statistiques temps réel** : Nombre d'agents total/actifs/inactifs
- **Export modèle** : Téléchargement automatique du fichier exemple CSV

### 🛡️ Sécurité et Conformité
- **Hachage SHA-256** : Noms et prénoms jamais stockés en clair
- **Sel configurable** : Variable `WHITELIST_SALT` dans `.env`
- **Validation stricte** : Format codes personnels SNCF (7 chiffres + 1 lettre)
- **Logs sécurisés** : Aucune donnée personnelle dans les fichiers de log
- **API sécurisées** : Endpoints whitelist protégés par authentification JWT

### 🔧 Architecture Technique
- **Classe PHP dédiée** : `WhitelistValidator` avec méthodes complètes
- **Composant React** : `WhitelistManagement` avec interface moderne WCS
- **Base de données** : Table `agents_whitelist` avec indexation optimisée
- **Scripts utilitaires** : Outils CLI pour administration et import de données

### 📚 Documentation Complète
- **README mis à jour** : Section whitelist avec guide complet
- **Guide d'import** : `README_IMPORT.md` avec instructions détaillées
- **Admin guide** : Fonctionnalités whitelist ajoutées au guide administrateur
- **API documentation** : Endpoints whitelist documentés

---

## [2.4.2] - 2025-08-01

### 📁 Organisation du Projet
- **Nouvelle structure** : Documentation déplacée dans `Docs/`
- **Scripts organisés** : Scripts utilitaires dans `script/`
- **Navigation améliorée** : Liens inter-documents corrigés avec les nouveaux chemins
- **Architecture claire** : Séparation logique documentation/code/scripts

### 📚 Documentation
- **Tous les `.md`** déplacés vers `Docs/` (sauf README.md principal à la racine)
- **Références croisées** mises à jour (liens relatifs corrects)
- **Structure claire** : `Docs/` pour la documentation, `script/` pour les utilitaires

---

## [2.4.1] - 2025-08-01

### 🎉 CORRECTIFS MAJEURS
- **✅ CORS résolu** : Correction des erreurs CORS bloquant les API calls
- **✅ Apache 2.4+ compatibilité** : Correction du `.htaccess` (Require au lieu de Order)
- **✅ Configuration simplifiée** : Un seul fichier `.env` auto-adaptatif

### 🔧 Améliorations Techniques
- **Auto-détection environnement** : Plus besoin de modifier manuellement les URLs
- **Auto-détection ports** : Frontend teste automatiquement 8080 puis 80 en fallback  
- **CORS intelligent** : Configuration automatique selon l'hostname détecté
- **Logs améliorés** : Debug complet pour diagnostiquer les problèmes

### 📁 Nettoyage Architecture
- **Suppression** : Fichiers `.env` multiples (frontend et backend spécifiques)
- **Unification** : Un seul `backend/.env` pour tous les environnements
- **Mise à jour** : Toute la documentation (.md) reflète les nouvelles configurations
- **Nettoyage** : Suppression des références obsolètes

### 🐛 Corrections Bugs
- **Erreur 500 API** : Correction des directives Apache obsolètes
- **Problème WAMP** : Port 8080 maintenant fonctionnel
- **Erreurs CORS** : Headers correctement envoyés
- **Fonctions présent/absent/note** : Correction des appels API (PUT au lieu de POST)

### 📚 Documentation
- **README.md** : Mis à jour avec la nouvelle architecture
- **DEPLOIEMENT_PRODUCTION.md** : Clarification des fichiers à transférer
- **ENVIRONMENTS.md** : Documentation de la nouvelle configuration automatique
- **Dépannage** : Ajout des solutions aux problèmes fréquents

---

## Versions Antérieures

Des modifications ont été apportées avant cette date mais ne sont pas documentées dans ce changelog.

---

**Migration depuis version précédente :**
1. Supprimer tous les anciens `.env` 
2. Créer un seul `backend/.env` (voir `.env.example`)
3. Le frontend se configurera automatiquement
4. Corriger le `.htaccess` si nécessaire (Apache 2.4+)