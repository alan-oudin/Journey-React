# Journey - Application Journée des Proches

Application web moderne pour la gestion des inscriptions à la journée des proches SNCF.

## 📁 Architecture du projet

```
journey/
├── README.md                    # Documentation principale
├── ADMIN_GUIDE.md              # Guide administrateur  
├── DEPLOIEMENT_PRODUCTION.md   # Guide de déploiement
├── ENVIRONMENTS.md             # Configuration multi-environnements
├── STRUCTURE_CLEAN.md          # Documentation de l'architecture
├── api-test.js                 # Script de test de l'API
├── switch-env.bat/sh           # Scripts d'information environnements
├── package.json                # Dependencies globales (node-fetch, wcs)
│
├── backend/                    # 🔧 API PHP + Base de données
│   ├── .env.development        # Configuration WAMP (dev)
│   ├── .env.production         # Configuration XAMPP (prod)
│   ├── .env.example            # Exemple de configuration
│   ├── add_admin.php           # Script CLI pour ajouter des admins
│   ├── composer.json           # Dependencies PHP
│   ├── vendor/                 # Packages Composer
│   ├── database/
│   │   ├── localhost_journee_proches.sql  # Schema BDD
│   │   └── import_database.bat           # Script d'import
│   └── public/
│       └── api.php             # API REST principale
│
└── frontend/                   # ⚛️ Application React
    ├── package.json            # Dependencies React + WCS Design System
    ├── build/                  # Build de production
    ├── public/                 # Assets statiques
    │   ├── index.html
    │   ├── fonts/              # Polices Avenir SNCF
    │   └── logo/               # Logo SNCF
    └── src/                    # Code source
        ├── index.js            # Point d'entrée
        ├── App.jsx             # Composant racine
        ├── api.js              # Client API
        ├── config/
        │   └── environment.js  # Configuration multi-environnements
        ├── components/         # Composants réutilisables
        ├── pages/              # Pages de l'application
        └── contexts/           # Contextes React
```

## 🛠 Technologies utilisées

- **Frontend** : React 19, WCS Design System SNCF, React Router
- **Backend** : PHP 7.4+, API REST, PDO MySQL
- **Base de données** : MySQL 5.7+
- **Environnements** : WAMP (dev) + XAMPP (prod)
- **Build** : Create React App, Composer

## 🚀 Installation & Lancement

### Configuration Automatique Multi-Environnements

Ce projet supporte automatiquement deux environnements :
- **🟢 DEV** : WAMP local (`localhost:3000` + `localhost:8080`)  
- **🔴 PROD** : XAMPP serveur (`tmtercvdl.sncf.fr` + `127.0.0.1`)

### 1. Installation Dependencies

```bash
# Installation globale (racine)
npm install

# Installation frontend
cd frontend && npm install

# Installation backend  
cd ../backend && composer install
```

### 2. Configuration Base de Données

```bash
# Importer le schema
mysql -u root -p < backend/database/localhost_journee_proches.sql

# Ou utiliser le script Windows
backend/database/import_database.bat
```

### 3. Lancement Développement (WAMP)

```bash
# Vérifier la configuration
switch-env.bat dev

# Lancer React
cd frontend && npm start

# API accessible sur : http://localhost:8080/journey/backend/public/api.php
# Frontend accessible sur : http://localhost:3000
```

### 4. Build Production (XAMPP)

```bash
# Vérifier la configuration  
switch-env.bat prod

# Build React
cd frontend && npm run build

# Déployer les fichiers build/ sur le serveur XAMPP
```

> **✨ Configuration Automatique** : Les URLs d'API et paramètres CORS sont configurés automatiquement selon l'environnement détecté !

## ⭐ Fonctionnalités principales

### 👤 Espace Public
- **Inscription agent** : Formulaire avec code personnel (7 chiffres + lettre)
- **Choix créneau** : Sélection matin/après-midi avec places disponibles
- **Gestion proches** : Nombre d'accompagnants (0 à 4)
- **Restauration** : Option repas sur place

### 🛡 Espace Admin (authentifié)
- **Gestion agents** : Modification statuts, suppression, notes
- **Recherche rapide** : Par code personnel
- **Statistiques temps réel** : Inscrits, présents, absents, annulés
- **Export CSV** : Données complètes pour traitement
- **Gestion créneaux** : Vue globale matin/après-midi (14 places max)

### 🔧 Fonctionnalités Techniques
- **Multi-environnements** : Configuration automatique dev/prod
- **API REST** : Endpoints complets avec authentification JWT
- **Design System SNCF** : Interface cohérente avec WCS
- **PWA Ready** : Service Worker pour utilisation offline
- **Responsive** : Compatible mobile/tablette/desktop

## 🔒 Sécurité & Configuration

### Variables d'Environnement
- **Development** : `.env.development` (WAMP localhost)
- **Production** : `.env.production` (XAMPP serveur)
- **CORS automatique** : Configuré selon l'environnement
- **Base de données** : Credentials séparés par environnement

### Sécurité
- ✅ Validation côté serveur (codes personnels, capacités)
- ✅ Authentification JWT pour l'admin
- ✅ Protection CSRF et injection SQL (PDO prepared statements)
- ✅ Logs et monitoring selon environnement
- ✅ Fichiers sensibles protégés (.env exclus du versioning)

## 📚 Documentation

- **[ENVIRONMENTS.md](ENVIRONMENTS.md)** : Configuration des environnements
- **[DEPLOIEMENT_PRODUCTION.md](DEPLOIEMENT_PRODUCTION.md)** : Guide de déploiement
- **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)** : Guide administrateur
- **[STRUCTURE_CLEAN.md](STRUCTURE_CLEAN.md)** : Architecture détaillée

## Contribution

1. Forker le repo
2. Créer une branche (`feature/ma-fonctionnalite`)
3. Proposer une Pull Request

---

**Projet modernisé : React + PHP/MySQL**

Pour toute question, consulter le code ou ouvrir une issue.

