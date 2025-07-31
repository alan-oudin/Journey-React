# Gestion des Environnements - Journey

Ce projet supporte deux environnements distincts avec configuration automatique et détection intelligente.

## 🔧 Environnements Disponibles

### 🟢 DEVELOPMENT (WAMP Local)
- **Frontend** : `http://localhost:3000` (React Dev Server)
- **Backend** : `http://localhost:8080/journey/backend/public/api.php`
- **Base de données** : `localhost:3306` (WAMP MySQL)
- **CORS** : `http://localhost:3000`
- **Debug** : Activé

### 🔴 PRODUCTION (XAMPP Serveur)
- **Frontend** : `https://tmtercvdl.sncf.fr/journey`
- **Backend** : `http://127.0.0.1/journey/backend/public/api.php`
- **Base de données** : `127.0.0.1:3306` (XAMPP MySQL)
- **CORS** : `https://tmtercvdl.sncf.fr`
- **Debug** : Désactivé

## 🚀 Scripts d'Information

### Windows (WAMP)
```bash
# Afficher la configuration développement
switch-env.bat dev

# Afficher la configuration production  
switch-env.bat prod
```

### Linux/Mac
```bash
# Rendre le script exécutable (une seule fois)
chmod +x switch-env.sh

# Afficher la configuration développement
./switch-env.sh dev

# Afficher la configuration production
./switch-env.sh prod
```

> **Note** : Ces scripts affichent les informations de configuration mais ne modifient rien. La configuration est **automatique** !

## 📁 Fichiers de Configuration

### Frontend
- `frontend/src/config/environment.js` - Configuration automatique selon NODE_ENV

### Backend  
- `backend/.env.development` - Variables d'environnement WAMP
- `backend/.env.production` - Variables d'environnement XAMPP
- `backend/.env.example` - Exemple de configuration

> **✨ Simplification** : Plus de fichiers `.htaccess` redondants ! CORS géré automatiquement dans `api.php`.

## 🔄 Configuration Automatique

### Frontend (React)
Le frontend détecte automatiquement l'environnement via `process.env.NODE_ENV` :
- `npm start` → environment = `development`
- `npm run build` → environment = `production`

### Backend (PHP)
Le backend détecte automatiquement l'environnement via l'hostname :
- `localhost` ou `127.0.0.1` → `.env.development`
- Autres domaines → `.env.production`

## 🧪 Tests

### Tester l'environnement DEV
```bash
# Activer l'environnement dev
switch-env.bat dev

# Tester l'API
curl http://localhost:8080/journey/backend/public/api.php?path=test

# Démarrer React
cd frontend
npm start
```

### Tester l'environnement PROD
```bash
# Activer l'environnement prod
switch-env.bat prod

# Tester l'API (sur le serveur)
curl http://127.0.0.1/journey/backend/public/api.php?path=test

# Build React
cd frontend
npm run build
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
- [ ] `switch-env.bat dev` exécuté
- [ ] React démarré avec `npm start`
- [ ] Base de données importée

### Production (XAMPP)
- [ ] XAMPP configuré sur le serveur
- [ ] `switch-env.bat prod` exécuté (ou copie manuelle)
- [ ] Build React créé avec `npm run build`
- [ ] Fichiers uploadés sur le serveur
- [ ] Base de données importée

## ⚠️ Notes Importantes

1. **Sécurité** : Les fichiers `.env*` sont protégés par `.htaccess`
2. **CORS** : Configuration automatique selon l'environnement
3. **Base de données** : Vérifier les paramètres selon l'environnement
4. **SSL** : Production utilise HTTPS, développement utilise HTTP