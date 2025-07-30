# Guide de Déploiement en Production - JourneyV2

## 📋 Prérequis

### Serveur de Production
- **Serveur web** : Apache ou Nginx
- **PHP** : Version 7.4 ou supérieure
- **Base de données** : MySQL 5.7+ ou MariaDB 10.2+
- **Node.js** : Version 16+ (pour le build du frontend)
- **Accès SSH** au serveur de production

### Outils de Développement
- Git
- Composer (pour les dépendances PHP)
- npm ou yarn (pour les dépendances JavaScript)

## 🚀 Procédure de Déploiement

### 1. Préparation de l'Environnement Local

#### A. Build du Frontend React
```bash
# Depuis le répertoire racine du projet
cd frontend
npm install
npm run build
```

Cette commande crée un dossier `build/` contenant les fichiers optimisés pour la production.

#### B. Installation des Dépendances Backend
```bash
# Depuis le répertoire backend
cd backend
composer install --no-dev --optimize-autoloader
```

### 2. Configuration de Production

#### A. Configuration de la Base de Données
1. **Créer la base de données** sur le serveur de production
2. **Importer le schéma** :
   ```bash
   mysql -u username -p database_name < backend/database/localhost_journee_proches.sql
   ```

#### B. Configuration des Variables d'Environnement
Modifiez le fichier `backend/.env.production` :
```bash
# Configuration de la base de données de production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=journee_proches_prod
DB_USER=utilisateur_prod
DB_PASSWORD=mot_de_passe_securise

# Configuration générale
APP_ENV=production
APP_DEBUG=false

# CORS (ajustez selon votre domaine)
CORS_ORIGIN=https://votre-domaine.com
```

#### C. Configuration des Environnements
Le système utilise maintenant une configuration automatique basée sur l'environnement :

**Frontend :**
- `.env.development` : Configuration automatique en développement
- `.env.production` : Configuration automatique en production  
- Les URLs d'API sont configurées automatiquement selon `NODE_ENV`
- Logging de debug automatiquement désactivé en production

**Backend :**
- `.env.development` : Base de données et CORS pour le développement
- `.env.production` : Configuration sécurisée pour la production
- Détection automatique de l'environnement basée sur l'hôte
- Gestion des erreurs adaptée à l'environnement

**Avantages :**
- ✅ Plus besoin de modifier manuellement les URLs lors du déploiement
- ✅ Configuration CORS automatique selon l'environnement
- ✅ Debug désactivé automatiquement en production
- ✅ Timeouts d'API adaptés à l'environnement
- ✅ Séparation claire entre développement et production

### 3. Déploiement sur le Serveur

#### A. Structure des Fichiers sur le Serveur
```
/var/www/html/votre-site/
├── api/
│   ├── api.php
│   └── vendor/
├── index.html (du build React)
├── static/
│   ├── css/
│   ├── js/
│   └── media/
└── fonts/
```

#### B. Upload des Fichiers
1. **Frontend** : Copier tout le contenu du dossier `frontend/build/` vers la racine web
2. **Backend** : Copier le contenu de `backend/public/` vers le dossier `api/`
3. **Dépendances** : Copier le dossier `backend/vendor/` vers `api/vendor/`
4. **Configuration** : Copier le fichier `backend/.env.production` vers `api/.env.production`

#### C. Permissions des Fichiers
```bash
# Sur le serveur, définir les bonnes permissions
chmod -R 755 /var/www/html/votre-site/
chmod -R 644 /var/www/html/votre-site/api/*.php
```

### 4. Configuration du Serveur Web

#### A. Apache (.htaccess)
Créer un fichier `.htaccess` à la racine :
```apache
RewriteEngine On

# Gestion des routes React (SPA)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule . /index.html [L]

# Configuration CORS pour l'API
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Gestion des requêtes OPTIONS
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

#### B. Nginx
Configuration dans le fichier de site Nginx :
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    root /var/www/html/votre-site;
    index index.html;

    # Gestion des fichiers statiques
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API PHP
    location /api/ {
        try_files $uri $uri/ @php;
    }

    location @php {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index api.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root/api/api.php;
    }

    # React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # CORS Headers
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
}
```

### 5. Sécurisation

#### A. HTTPS
```bash
# Installation de Certbot pour Let's Encrypt
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d votre-domaine.com
```

#### B. Sécurisation des Accès Admin
- Changer les mots de passe par défaut
- Utiliser des mots de passe forts
- Limiter les tentatives de connexion

### 6. Tests de Production

#### A. Vérifications à effectuer :
- [ ] Page d'accueil se charge correctement
- [ ] Inscription d'un nouvel agent fonctionne
- [ ] Connexion admin fonctionne
- [ ] Modification des utilisateurs fonctionne
- [ ] Responsive design sur mobile
- [ ] HTTPS actif et certificat valide

#### B. Tests de Performance
```bash
# Test de charge basique
ab -n 100 -c 10 https://votre-domaine.com/
```

### 7. Maintenance

#### A. Sauvegarde Automatique
Script de sauvegarde quotidienne :
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u username -p database_name > /backups/db_backup_$DATE.sql
tar -czf /backups/files_backup_$DATE.tar.gz /var/www/html/votre-site/
```

#### B. Monitoring
- Surveillance des logs d'erreur
- Monitoring de l'espace disque
- Vérification régulière des mises à jour de sécurité

### 8. Mise à Jour

Pour déployer une nouvelle version :
1. Effectuer les modifications en local
2. Tester en environnement de développement
3. Créer un nouveau build : `npm run build`
4. Sauvegarder la version actuelle en production
5. Déployer les nouveaux fichiers
6. Tester la nouvelle version

## 🔧 Dépannage

### Problèmes Courants
- **Erreur 404 sur les routes** : Vérifier la configuration du serveur web
- **Erreur CORS** : Vérifier les headers CORS dans la configuration
- **Problème de base de données** : Vérifier les paramètres de connexion
- **Fichiers non trouvés** : Vérifier les permissions et chemins

### Logs à consulter
- `/var/log/apache2/error.log` (Apache)
- `/var/log/nginx/error.log` (Nginx)
- Logs PHP dans `/var/log/php/`

## 📞 Support

En cas de problème, vérifier :
1. Les logs du serveur web
2. Les logs PHP
3. La console développeur du navigateur
4. La configuration de la base de données