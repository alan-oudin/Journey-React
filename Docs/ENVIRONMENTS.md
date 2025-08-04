# Gestion des Environnements - Journey

Ce projet supporte deux environnements distincts avec **configuration automatique complète** et détection intelligente.

## 📝 **NOUVELLE ARCHITECTURE SIMPLIFIÉE**

✅ **Un seul fichier `.env`** → `backend/.env`  
✅ **Auto-détection** de l'environnement selon l'hostname  
✅ **Auto-détection** des ports disponibles côté frontend  
✅ **Configuration CORS automatique**  

## 🔧 Environnements Disponibles

### 🟢 DEVELOPMENT (WAMP Local)
- **Frontend** : `http://localhost:3000` (React Dev Server)
- **Backend** : `http://localhost:8080/journey/backend/public/api.php` (auto-fallback sur port 80)
- **Base de données** : `localhost:3306` (WAMP MySQL)
- **CORS** : Auto-détecté pour `http://localhost:3000`
- **Debug** : Activé

### 🔴 PRODUCTION (XAMPP Serveur)
- **Frontend** : `https://tmtercvdl.sncf.fr/journey`
- **Backend** : `http://127.0.0.1/journey/backend/public/api.php`
- **Base de données** : `127.0.0.1:3306` (XAMPP MySQL)
- **CORS** : Auto-détecté pour `https://tmtercvdl.sncf.fr`
- **Debug** : Activé (configurable)

## 🚀 Configuration Entièrement Automatique

Plus besoin de scripts ou de configuration manuelle ! L'environnement est automatiquement détecté selon :

- **Développement** : Hostname = `localhost` ou `127.0.0.1`
- **Production** : Tous les autres hostnames

La configuration se fait **automatiquement** côté frontend et backend.

## 📁 Fichiers de Configuration

### Frontend
- `frontend/src/config/environment.js` - Auto-détection ports + configuration selon NODE_ENV
- `frontend/src/api.js` - Auto-résolution URL API avec fallback

### Backend  
- `backend/.env` - **Fichier unique** auto-adaptatif local/prod
- `backend/.env.example` - Exemple de configuration

> **✨ NOUVEAUTÉ** : 
> - Plus de fichiers `.env` multiples !
> - Auto-détection complète côté frontend et backend
> - Correction `.htaccess` pour Apache 2.4+ (Require all denied)

## 🔄 Configuration Automatique

### Frontend (React)
Le frontend détecte automatiquement l'environnement via `process.env.NODE_ENV` :
- `npm start` → environment = `development`
- `npm run build` → environment = `production`

### Backend (PHP)
Le backend détecte automatiquement l'environnement via l'hostname :
- `localhost` ou `127.0.0.1` → Mode développement (CORS: localhost:3000)
- Autres domaines → Mode production (CORS: tmtercvdl.sncf.fr)
- **Un seul fichier** `backend/.env` pour tous les environnements

## 🧪 Tests

### Tester l'environnement DEV
```bash
# Tester l'API
curl http://localhost:8080/journey/backend/public/api.php?path=test

# Démarrer React (auto-détection)
cd frontend && npm start
```

### Tester l'environnement PROD
```bash
# Tester l'API (sur le serveur)
curl http://127.0.0.1/journey/backend/public/api.php?path=test

# Build React (auto-détection)
cd frontend && npm run build
```

## 🔍 Debugging

### Vérifier l'environnement actuel
- **Frontend** : Ouvrir la console développeur, chercher `[DEV] Environment:`
- **Backend** : Accéder à `/api.php?path=test` pour voir la configuration active

### Logs
- **DEV** : Logs affichés dans console + fichiers log
- **PROD** : Logs minimaux, erreurs uniquement

## 📋 Checklist Déploiement

### Développement (WAMP)
- [ ] WAMP démarré
- [ ] Base de données importée
- [ ] `backend/.env` configuré
- [ ] React démarré avec `npm start` (auto-configuration)

### Production (XAMPP)
- [ ] XAMPP configuré sur le serveur
- [ ] Base de données importée
- [ ] `backend/.env` copié sur le serveur
- [ ] Build React créé avec `npm run build` (auto-configuration)
- [ ] Fichiers uploadés sur le serveur

## ⚠️ Notes Importantes

1. **Sécurité** : Les fichiers `.env*` sont protégés par `.htaccess` (Apache 2.4+)
2. **CORS** : Configuration automatique selon l'hostname détecté
3. **Ports** : Auto-détection 8080 puis 80 en fallback côté frontend
4. **Apache** : `.htaccess` corrigé pour Apache 2.4+ (Require au lieu de Order)
5. **SSL** : Production utilise HTTPS, développement utilise HTTP