# Structure du projet Journey - Nettoyée

## 📁 Structure Finale

```
journey/
├── README.md                     # Documentation principale
├── ADMIN_GUIDE.md               # Guide administrateur
├── DEPLOIEMENT_PRODUCTION.md    # Guide de déploiement
├── ENVIRONMENTS.md              # Guide des environnements
├── STRUCTURE_CLEAN.md           # Ce fichier
├── api-test.js                  # Script de test API Node.js
├── switch-env.bat               # Script Windows pour infos environnements
├── switch-env.sh                # Script Unix pour infos environnements
├── package.json                 # Dependencies racine (node-fetch, wcs)
├── package-lock.json           # Lock file racine
├── node_modules/               # Modules Node.js racine
│
├── backend/                    # API PHP + Base de données
│   ├── .env                   # Variables d'environnement par défaut
│   ├── .env.development       # Configuration WAMP
│   ├── .env.production       # Configuration XAMPP  
│   ├── .env.example          # Exemple de configuration
│   ├── add_admin.php         # Script CLI pour ajouter des admins
│   ├── composer.json         # Dependencies PHP
│   ├── composer.lock         # Lock file PHP
│   ├── vendor/              # Packages Composer
│   ├── database/
│   │   ├── localhost_journee_proches.sql  # Schema principal BDD
│   │   └── import_database.bat           # Script import Windows
│   └── public/
│       └── api.php          # API REST principale
│
└── frontend/                # Application React
    ├── package.json        # Dependencies React
    ├── package-lock.json   # Lock file React
    ├── node_modules/       # Modules Node.js React
    ├── build/             # Build de production
    ├── public/            # Assets statiques
    │   ├── index.html
    │   ├── manifest.json
    │   ├── favicon.ico
    │   ├── robots.txt
    │   ├── logo192.png
    │   ├── logo512.png
    │   ├── fonts/         # Polices Avenir
    │   └── logo/          # Logo SNCF
    └── src/               # Code source React
        ├── index.js       # Point d'entrée React
        ├── index.css      # Styles globaux
        ├── App.jsx        # Composant racine
        ├── api.js         # Client API
        ├── config/
        │   └── environment.js  # Configuration multi-environnements
        ├── contexts/
        │   └── AlertContext.tsx  # Context pour les alertes
        ├── components/    # Composants réutilisables
        │   ├── Header.jsx
        │   ├── Navbar.jsx
        │   ├── Footer.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── SearchBar.jsx
        │   ├── StatCard.jsx
        │   ├── AgentCard.jsx
        │   ├── AlertMessage.jsx
        │   ├── UserEditor.jsx
        │   └── AdminManagement.jsx
        ├── pages/         # Pages de l'application
        │   ├── InscriptionPage.jsx  # Page d'inscription (/)
        │   ├── AdminPage.jsx        # Page admin (/admin)
        │   ├── GestionPage.jsx      # Sous-page de gestion
        │   ├── RecherchePage.jsx    # Page recherche (/recherche)
        │   └── LoginPage.jsx        # Page connexion (/login)
        ├── service-worker.js        # Service Worker PWA
        └── serviceWorkerRegistration.js  # Enregistrement SW
```

## 🗑️ Fichiers Supprimés

### Backend
- ❌ `backend/config/` - Configuration redondante avec .env
- ❌ `backend/public/test-*.php` - Fichiers de test
- ❌ `backend/public/info.php` - Fichier d'info PHP
- ❌ `backend/database/add_*_column.sql` - Migrations appliquées

### Frontend  
- ❌ `frontend/src/App.test.js` - Tests React
- ❌ `frontend/src/setupTests.js` - Configuration des tests
- ❌ `frontend/src/reportWebVitals.js` - Métriques (non utilisées)
- ❌ `frontend/src/logo.svg` - Logo par défaut React
- ❌ `frontend/src/main.jsx` - Point d'entrée dupliqué
- ❌ `frontend/src/components/ExampleAlertUsage.jsx` - Exemple
- ❌ `frontend/src/components/icons/` - Icônes non utilisées
- ❌ `frontend/src/contexts/README.md` - Documentation interne

### Configuration
- ❌ `.htaccess.development` - Configuration Apache non fonctionnelle
- ❌ `.htaccess.production` - Configuration Apache non fonctionnelle
- ❌ Fichiers de test temporaires

### Racine www
- ❌ `test-php.php` - Fichier de test temporaire

## ✅ Fonctionnalités Conservées

### Backend
- ✅ API REST complète (api.php)
- ✅ Gestion multi-environnements (.env.*)
- ✅ Script d'administration (add_admin.php)
- ✅ Schema de base de données
- ✅ Gestion CORS automatique

### Frontend
- ✅ Application React complète
- ✅ Toutes les pages fonctionnelles
- ✅ Tous les composants utilisés
- ✅ Configuration multi-environnements
- ✅ Service Worker PWA
- ✅ Styles et assets

### Configuration
- ✅ Scripts d'information environnements
- ✅ Documentation complète
- ✅ Configuration automatique CORS/DB

## 🎯 Résultat

- **Taille réduite** : Suppression de ~50+ fichiers inutiles
- **Structure claire** : Organisation logique maintenue
- **Fonctionnalités intactes** : Aucune perte de fonctionnalité
- **Configuration simplifiée** : CORS géré automatiquement par PHP
- **Documentation à jour** : Guides mis à jour

Le projet est maintenant optimisé, ne contient que les fichiers nécessaires et reste pleinement fonctionnel.