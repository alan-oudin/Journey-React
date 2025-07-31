# Guide de Déploiement - Journey

Application Journey avec configuration automatique multi-environnements.

## 🎯 Environnements Supportés

### 🟢 Développement (WAMP)
**Configuration automatique via `.env.development`**
- **Frontend** : `http://localhost:3000` (React dev server)
- **Backend** : `http://localhost:8080/journey/backend/public/api.php`
- **Base de données** : `localhost:3306` (WAMP MySQL)
- **CORS** : Configuré pour `localhost:3000`

### 🔴 Production (XAMPP)
**Configuration automatique via `.env.production`**
- **Frontend** : `https://tmtercvdl.sncf.fr/journey`
- **Backend** : `http://127.0.0.1/journey/backend/public/api.php`
- **Base de données** : `127.0.0.1:3306` (XAMPP MySQL)
- **CORS** : Configuré pour `tmtercvdl.sncf.fr`

> **✨ Nouveau** : Plus besoin de modifier manuellement les URLs ! La configuration se fait automatiquement selon l'environnement détecté.

---

## 🚀 Déploiement XAMPP (Production)

### 1. Préparation Locale

```bash
# Vérifier la configuration
switch-env.bat prod

# Build du frontend
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
├── static/                       # Depuis frontend/build/static/
├── fonts/                        # Depuis frontend/build/fonts/  
├── logo/                         # Depuis frontend/build/logo/
├── manifest.json                 # Depuis frontend/build/
├── robots.txt                    # Depuis frontend/build/
├── favicon.ico                   # Depuis frontend/build/
└── backend/
    ├── .env.production           # Configuration production
    ├── public/
    │   └── api.php               # API principale
    ├── database/
    │   └── localhost_journee_proches.sql
    └── vendor/                   # Dépendances Composer
```

### 3. Configuration Automatique

Les fichiers de configuration sont **automatiquement** utilisés :

**Backend** (`.env.production`) :
```env
# Configuration PRODUCTION - XAMPP sur serveur
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=journee_proches
DB_USER=root
DB_PASSWORD=
APP_ENV=production
APP_DEBUG=false
CORS_ORIGIN=https://tmtercvdl.sncf.fr
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
│   ├── .env.production # À adapter selon serveur
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
    Order allow,deny
    Deny from all
</Files>
```

> **Important** : CORS est géré automatiquement par `api.php` selon l'environnement détecté.

---

## 🔧 Configuration Avancée

### Variables d'Environnement

**Modifier `.env.production` selon votre serveur :**
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
- [ ] `.env.production` configuré

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
- Vérifier que `CORS_ORIGIN` dans `.env.production` correspond au domaine frontend
- La gestion CORS est automatique dans `api.php`

**API 500 :**
- Vérifier les permissions PHP
- Consulter les logs Apache/PHP
- Vérifier la connexion base de données

**Routes React 404 :**
- Vérifier la configuration `.htaccess`
- S'assurer que `mod_rewrite` est activé

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

- **[README.md](README.md)** : Vue d'ensemble et installation
- **[ENVIRONMENTS.md](ENVIRONMENTS.md)** : Configuration détaillée des environnements
- **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)** : Guide d'utilisation admin
- **[STRUCTURE_CLEAN.md](STRUCTURE_CLEAN.md)** : Architecture technique

**🎯 L'objectif : Un déploiement simple avec une configuration automatique !**