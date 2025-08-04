# Changelog - Journey App

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