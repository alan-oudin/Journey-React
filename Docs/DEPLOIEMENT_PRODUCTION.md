# Guide de Déploiement - Journey

Application Journey avec configuration automatique multi-environnements.

## 🎯 Environnements Supportés

### 🟢 Développement (WAMP)
**Configuration automatique via `backend/.env`**
- **Frontend** : `http://localhost:3000` (React dev server)
- **Backend** : `http://localhost:8080/journey/backend/public/api.php`
- **Base de données** : `localhost:3306` (WAMP MySQL)
- **CORS** : Auto-détecté pour `localhost:3000`

### 🔴 Production (XAMPP)
**Configuration automatique via `backend/.env`**
- **Frontend** : `https://tmtercvdl.sncf.fr/journey`
- **Backend** : `http://127.0.0.1/journey/backend/public/api.php`
- **Base de données** : `127.0.0.1:3306` (XAMPP MySQL)
- **CORS** : Auto-détecté pour `tmtercvdl.sncf.fr`

> **✨ Nouveau** : Plus besoin de modifier manuellement les URLs ! La configuration se fait automatiquement selon l'environnement détecté.

---

## 🚀 Déploiement XAMPP (Production)

### 1. Préparation Locale

```bash
# Build du frontend (auto-détection production)
cd frontend
npm run build

# Installer les dépendances backend (si pas fait)
cd ../backend
composer install --no-dev --optimize-autoloader
```

### 2. Structure de Déploiement

**Fichiers à transférer vers XAMPP :**
```
C:\xampp\htdocs\journey\
├── index.html                    # Depuis frontend/build/
├── .htaccess                     # Depuis journey
├── static/                       # Depuis frontend/build/static/
├── fonts/                        # Depuis frontend/build/fonts/  
├── logo/                         # Depuis frontend/build/logo/
├── manifest.json                 # Depuis frontend/build/
├── robots.txt                    # Depuis frontend/build/
├── favicon.ico                   # Depuis frontend/build/
└── backend/
    ├── .env                      # Configuration backend unique (BDD, CORS)
    ├── public/
    │   └── api.php               # API principale
    ├── database/
    │   └── localhost_journee_proches.sql
    └── vendor/                   # Dépendances Composer
```

**⚠️ Important : Différence entre les fichiers `.env` :**

📁 **Backend `.env`** (à transférer) :
- `backend/.env` → Configuration PHP unique : base de données, CORS, debug
- Auto-détection de l'environnement selon l'host (localhost = dev, autre = prod)
- Utilisé par `api.php` sur le serveur pour se connecter à MySQL
- **OBLIGATOIRE** sur le serveur

📁 **Frontend `.env`** (SUPPRIMÉS) :
- Plus de fichiers `.env` dans le frontend
- Configuration automatique via `environment.js`
- Auto-détection des ports disponibles (8080 puis 80 en fallback)

### 3. Configuration Automatique

Les fichiers de configuration sont **automatiquement** utilisés :

**Backend** (`backend/.env`) :
```env
# Configuration Journey - Auto-détection local/prod
DB_HOST=localhost
DB_PORT=3306
DB_NAME=journee_proches
DB_USER=root
DB_PASSWORD=

# Configuration générale
APP_DEBUG=true
APP_TIMEZONE=Europe/Paris

# CORS - automatiquement adapté selon l'environnement détecté
# Local: http://localhost:3000
# Prod: https://tmtercvdl.sncf.fr
```

**Frontend** : Configuration automatique dans `environment.js`
- Détection automatique de `NODE_ENV=production`
- URL API définie sur `http://127.0.0.1/journey/backend/public/api.php`
- CORS automatiquement configuré

### 4. Base de Données

```sql
-- Créer/Importer la base
mysql -u root -p < backend/database/localhost_journee_proches.sql

-- Ou via phpMyAdmin
-- http://127.0.0.1/phpmyadmin
```

### 5. Test de Déploiement

```bash
# API
curl http://127.0.0.1/journey/backend/public/api.php?path=test

# Frontend
# Ouvrir https://tmtercvdl.sncf.fr/journey
```

---

## 🌐 Déploiement Serveur Distant (Optionnel)

### 1. Prérequis Serveur
- Apache/Nginx avec PHP 7.4+
- MySQL 5.7+
- Certificat SSL (HTTPS)
- Accès SSH

### 2. Upload des Fichiers

```bash
# Structure sur le serveur
/var/www/html/journey/
├── index.html          # Build React
├── static/             # Assets React
├── backend/
│   ├── .env           # Configuration unique auto-adaptative
│   └── public/api.php  # API
└── vendor/             # Dependencies PHP
```

### 3. Configuration Serveur

**Apache (.htaccess)** :
```apache
# Gestion des routes React (SPA)
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !^/journey/backend/
    RewriteRule . /journey/index.html [L]
</IfModule>

# Sécurité - Protection des fichiers sensibles
<Files ".env*">
    Require all denied
</Files>
```

> **Important** : CORS est géré automatiquement par `api.php` selon l'environnement détecté.

---

## 🔧 Configuration Avancée

### Variables d'Environnement

**Modifier `backend/.env` selon votre serveur :**
```env
# Base de données du serveur
DB_HOST=127.0.0.1           # ou IP du serveur MySQL
DB_NAME=journee_proches     # nom de votre BDD
DB_USER=username            # utilisateur MySQL
DB_PASSWORD=password        # mot de passe sécurisé

# CORS selon votre domaine
CORS_ORIGIN=https://votre-domaine.com

# Sécurité production
APP_DEBUG=false
LOG_LEVEL=error
```

### Frontend (si domaine différent)

**Modifier `frontend/src/config/environment.js` :**
```javascript
production: {
  API_BASE_URL: 'https://votre-domaine.com/journey/backend/public/api.php',
  FRONTEND_URL: 'https://votre-domaine.com/journey',
  // ...
}
```

---

## ✅ Checklist de Déploiement

### Avant Déploiement
- [ ] `npm run build` exécuté
- [ ] `composer install --no-dev` exécuté
- [ ] Base de données importée
- [ ] `backend/.env` configuré

### Tests Post-Déploiement
- [ ] Page d'accueil se charge : `/journey`
- [ ] API répond : `/journey/backend/public/api.php?path=test`
- [ ] Inscription fonctionne
- [ ] Login admin fonctionne
- [ ] Responsive mobile/desktop
- [ ] HTTPS actif (si serveur distant)

### Maintenance
- [ ] Sauvegarde BDD régulière
- [ ] Logs d'erreur surveillés
- [ ] Mises à jour sécurité appliquées

---

## 🔧 Dépannage

### Problèmes Courants

**Erreur CORS :**
- Vérifier que `CORS_ORIGIN` dans `.env` correspond au domaine frontend
- La gestion CORS est automatique dans `api.php`

**API 500 :**
- ⚠️ **Problème fréquent** : Directives `.htaccess` obsolètes
  - Apache 2.4+ ne supporte plus `Order allow,deny`
  - Utiliser `Require all denied` à la place
- Vérifier les permissions PHP
- Consulter les logs Apache/PHP : `tail -f C:\wamp64\logs\apache_error.log`
- Vérifier la connexion base de données

**Routes React 404 :**
- Vérifier la configuration `.htaccess`
- S'assurer que `mod_rewrite` est activé

**Configuration WAMP :**
- Port 80 souvent bloqué par Windows : utiliser le port 8080
- Vérifier que Apache WAMP fonctionne : `netstat -an | findstr :8080`

### Logs Utiles

```bash
# Logs Apache
tail -f /var/log/apache2/error.log

# Logs PHP (selon config)
tail -f /var/log/php/error.log

# Test API direct
curl -v http://127.0.0.1/journey/backend/public/api.php?path=test
```

---

## 📚 Documentation Complémentaire

- **[README.md](../README.md)** : Vue d'ensemble et installation
- **[ENVIRONMENTS.md](ENVIRONMENTS.md)** : Configuration détaillée des environnements
- **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)** : Guide d'utilisation admin
- **[CHANGELOG.md](CHANGELOG.md)** : Historique des modifications

**🎯 L'objectif : Un déploiement simple avec une configuration automatique !**