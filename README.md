# Journey - Application Journée des Proches

Application web moderne pour la gestion des inscriptions à la journée des proches SNCF.

## 📁 Architecture du projet

```
journey/
├── README.md                    # Documentation principale
├── Docs/                        # 📚 Documentation complète
│   ├── ADMIN_GUIDE.md          # Guide administrateur
│   ├── CHANGELOG.md            # Historique des modifications
│   ├── DEPLOIEMENT_PRODUCTION.md # Guide de déploiement
│   └── ENVIRONMENTS.md         # Configuration multi-environnements
├── scripts/                     # 🛠️ Scripts utiles
│   ├── api-test.js             # Script de test de l'API
│   ├── build-production.bat    # Script de build production (Windows)
│   └── build-production.sh     # Script de build production (Unix)
├── package.json                # Dependencies globales (node-fetch, wcs)
│
├── backend/                    # 🔧 API PHP + Base de données
│   ├── .env                    # Configuration unique auto-adaptative
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
# Lancer React - Configuration automatique !
cd frontend && npm start

# API accessible sur : http://localhost:8080/journey/backend/public/api.php
# Frontend accessible sur : http://localhost:3000
```

### 4. Build Production (XAMPP)

```bash
# Build React - Configuration automatique !
cd frontend && npm run build

# Déployer les fichiers build/ sur le serveur XAMPP
```

## 🏗️ Build & Distribution

### Script de Build

Le script `npm run build` utilise **Create React App** pour générer une version optimisée de l'application dans le dossier `dist/`.

#### Commande de Build
```bash
cd frontend
npm run build
```

#### Processus de Build
1. **Compilation** : Transpilation du code React/JSX en JavaScript standard
2. **Optimisation** : Minification des fichiers CSS/JS et optimisation des images
3. **Bundling** : Regroupement des modules avec Webpack
4. **Génération** : Création du dossier `build/` avec les fichiers optimisés

#### Structure du dossier `build/`
```
frontend/build/
├── index.html              # 📄 Page principale optimisée
├── asset-manifest.json     # 📋 Manifest des assets
├── service-worker.js       # 🔧 Service Worker PWA
├── manifest.json          # 📱 Manifest PWA
├── favicon.ico            # 🖼️ Favicon
├── robots.txt             # 🤖 Instructions robots
├── static/                # 📁 Assets statiques optimisés
│   ├── css/              # 🎨 Fichiers CSS minifiés avec hash
│   ├── js/               # ⚡ Fichiers JS minifiés avec hash
│   └── media/            # 🖼️ Images et fonts optimisées
├── fonts/                # 🔤 Polices Avenir SNCF
└── logo/                 # 🏢 Logos SNCF
```

#### Configuration automatique selon l'environnement
- **DEV (WAMP)** : `homepage: "/"` - Serveur de développement
- **PROD (XAMPP)** : `homepage: "/journey/"` - Sous-répertoire de production

#### Optimisations appliquées
- ✅ **Minification** : Réduction de 60-80% de la taille des fichiers
- ✅ **Tree Shaking** : Suppression du code inutilisé
- ✅ **Code Splitting** : Chargement asynchrone des composants
- ✅ **Cache Busting** : Hash dans les noms de fichiers pour invalidation cache
- ✅ **Service Worker** : Mise en cache intelligente pour utilisation offline
- ✅ **Compression** : Préparé pour gzip/brotli

#### Déploiement

##### Option 1 : Build manuel
```bash
# 1. Générer le build
cd frontend && npm run build

# 2. Copier le contenu de build/ vers le serveur web
# Pour XAMPP : copier dans htdocs/journey/
# Pour Apache : copier dans var/www/html/journey/
```

##### Option 2 : Script de build production automatisé 🚀
```bash
# Depuis la racine du projet
scripts\build-production.bat

# Ou avec version personnalisée
scripts\build-production.bat v2.1.0
```

**Avantages du script automatisé :**
- ✅ **Build complet** : Frontend + Backend optimisés
- ✅ **Package prêt** : Archive ZIP pour déploiement direct
- ✅ **Dependencies production** : Composer optimisé sans dev
- ✅ **Documentation incluse** : Instructions DEPLOYMENT.md
- ✅ **Structure optimale** : Fichiers organisés pour serveur web

#### Variables d'environnement
Le build utilise automatiquement :
- `PUBLIC_URL=/journey/` (production)
- Configuration API selon l'hostname de déploiement
- Assets optimisés selon `browserslist` du package.json

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
- **🔐 Whitelist** : Contrôle des agents autorisés à s'inscrire

### 🔧 Fonctionnalités Techniques
- **Multi-environnements** : Configuration automatique dev/prod
- **API REST** : Endpoints complets avec authentification JWT
- **Design System SNCF** : Interface cohérente avec WCS
- **PWA Ready** : Service Worker pour utilisation offline
- **Responsive** : Compatible mobile/tablette/desktop

## 🔒 Sécurité & Configuration

### Variables d'Environnement
- **Fichier unique** : `backend/.env` (auto-adaptatif local/prod)
- **Auto-détection** : Environnement détecté selon l'hostname
- **CORS automatique** : Configuré selon l'hostname détecté
- **Frontend intelligent** : Auto-détection des ports disponibles (8080 puis 80)

### Sécurité
- ✅ Validation côté serveur (codes personnels, capacités)
- ✅ Authentification JWT pour l'admin
- ✅ Protection CSRF et injection SQL (PDO prepared statements)
- ✅ Logs et monitoring selon environnement
- ✅ Fichiers sensibles protégés (.env exclus du versioning)

## 🔐 Système Whitelist

### Vue d'ensemble
Le système de whitelist sécurise l'inscription en n'autorisant que les agents préalablement enregistrés. Il protège les données personnelles avec un hachage SHA-256 conforme RGPD.

### 📋 Structure des données
```sql
-- Table agents_whitelist
code_personnel VARCHAR(8)  -- Ex: 1234567A (7 chiffres + 1 lettre)
nom_hash VARCHAR(64)       -- Hash SHA-256 du nom
prenom_hash VARCHAR(64)    -- Hash SHA-256 du prénom  
actif TINYINT(1)          -- 1=autorisé, 0=bloqué
```

### 🔧 Fonctionnalités administrateur
- **Ajout manuel** : Interface web pour ajouter un agent
- **Import CSV/Excel** : Import en lot depuis fichier structuré
- **Activation/Désactivation** : Contrôle des autorisations sans suppression
- **Statistiques** : Nombre d'agents total/actifs/inactifs
- **Recherche** : Par code personnel, nom ou prénom
- **Export** : Téléchargement du modèle CSV

### 📁 Scripts de gestion
- **[backend/scripts/import_whitelist_csv.php](backend/scripts/import_whitelist_csv.php)** : Import depuis CSV
- **[backend/scripts/import_whitelist_excel.php](backend/scripts/import_whitelist_excel.php)** : Import depuis Excel
- **[backend/scripts/README_IMPORT.md](backend/scripts/README_IMPORT.md)** : Guide complet d'import
- **[backend/scripts/exemple_whitelist.csv](backend/scripts/exemple_whitelist.csv)** : Modèle de fichier

### 🛡️ Validation côté inscription
Lors de l'inscription, le système :
1. Vérifie le format du code personnel (7 chiffres + 1 lettre)
2. Hache les nom/prénom fournis avec la même méthode
3. Compare les hash avec ceux de la whitelist
4. Autorise ou refuse l'inscription selon le résultat

### 🔒 Sécurité RGPD
- **Hachage SHA-256** : Noms et prénoms jamais stockés en clair
- **Sel configurable** : Variable `WHITELIST_SALT` dans `.env`
- **Codes en clair** : Seuls les codes personnels restent lisibles (nécessaires)
- **Logs sécurisés** : Aucune donnée personnelle dans les logs

## 📚 Documentation Complète

### 🏠 Navigation Rapide
- **[📚 Index Documentation](Docs/README.md)** : Vue d'ensemble de toute la documentation

### 🚀 Installation & Configuration
- **[ENVIRONMENTS.md](Docs/ENVIRONMENTS.md)** : Configuration des environnements (dev/prod)

### 🛠️ Déploiement & Administration
- **[DEPLOIEMENT_PRODUCTION.md](Docs/DEPLOIEMENT_PRODUCTION.md)** : Guide de déploiement XAMPP
- **[ADMIN_GUIDE.md](Docs/ADMIN_GUIDE.md)** : Guide d'administration complet
- **[BROWSER_COMPATIBILITY.md](Docs/BROWSER_COMPATIBILITY.md)** : Compatibilité navigateurs

### 🔐 Scripts Whitelist
- **[README_IMPORT.md](backend/scripts/README_IMPORT.md)** : Guide d'import whitelist
- **[import_whitelist_csv.php](backend/scripts/import_whitelist_csv.php)** : Script d'import CSV
- **[import_whitelist_excel.php](backend/scripts/import_whitelist_excel.php)** : Script d'import Excel

### 📝 Historique & Tests
- **[CHANGELOG.md](Docs/CHANGELOG.md)** : Versions et modifications
- **[DOCUMENTATION_TESTS_COMPLETE.md](Docs/DOCUMENTATION_TESTS_COMPLETE.md)** : Tests automatisés

### 🛠️ Scripts Utilitaires
- **[api-test.js](scripts/api-test.js)** : Script de test de l'API
- **[build-production.bat](scripts/build-production.bat)** : Script de build production automatisé
- **[add_admin.php](backend/add_admin.php)** : Ajout d'administrateurs CLI

### 📁 Organisation
- **[Docs/](Docs/)** : Documentation technique complète
- **[script/](script/)** : Scripts utilitaires généraux
- **[backend/scripts/](backend/scripts/)** : Scripts spécifiques backend

## Contribution

1. Forker le repo
2. Créer une branche (`feature/ma-fonctionnalite`)
3. Proposer une Pull Request

---

**Projet modernisé : React + PHP/MySQL**

Pour toute question, consulter le code ou ouvrir une issue.

