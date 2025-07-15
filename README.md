# JourneyV2 - Application Journée des Proches

## Architecture du projet

```
journeyV2/
├── frontend/         # Application React (interface utilisateur)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── backend/          # API PHP/MySQL (logique métier, accès DB)
│   ├── public/
│   │   ├── api.php
│   │   └── ...
│   ├── database/
│   ├── vendor/
│   ├── composer.json
│   └── ...
├── README.md         # Documentation du projet
└── .gitignore        # Fichiers/dossiers ignorés par git
```

## Technologies utilisées

- **Frontend** : React (Create React App)
- **Backend** : PHP 7+ (API REST), MySQL
- **Gestion des dépendances** : npm (frontend), Composer (backend)

## Installation & Lancement

### 1. Backend (PHP/MySQL)

1. Placer le dossier `backend/` dans un serveur compatible PHP (WAMP/XAMPP/LAMP...)
2. Importer la base de données depuis `backend/database/localhost_journee_proches.sql`
3. Configurer les accès DB dans `backend/public/api.php` ou via un fichier `.env`
4. Accès API : `http://localhost/backend/public/api.php`

### 2. Frontend (React)

1. Aller dans le dossier `frontend/`
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Lancer le serveur de développement :
   ```bash
   npm start
   ```
4. Accéder à l’interface : `http://localhost:3000`

> **Astuce** : Modifier l’URL de l’API dans `frontend/src/api.js` si besoin (ex : pour pointer vers le backend en production).

## Fonctionnalités principales

- Inscription d’un agent avec choix du créneau (places limitées)
- Connexion admin (gestion des statuts, suppression, export CSV)
- Recherche rapide d’agent par code personnel
- Statistiques avancées (présents, inscrits, absents, total personnes...)
- Affichage et gestion des créneaux (matin/après-midi)
- Export CSV des inscriptions

## Bonnes pratiques & sécurité

- Les variables sensibles (DB, API) doivent être placées dans un fichier `.env` (non versionné)
- Ne jamais exposer les identifiants de production dans le code source
- Utiliser un utilisateur MySQL dédié avec droits limités
- Sauvegarder régulièrement la base de données

## Déploiement

- **Backend** : déployer le dossier `backend/` sur un serveur PHP/MySQL
- **Frontend** : déployer le build React (`frontend/build/`) sur un serveur web (Apache/Nginx...)
- Adapter l’URL de l’API côté frontend si besoin

## Contribution

1. Forker le repo
2. Créer une branche (`feature/ma-fonctionnalite`)
3. Proposer une Pull Request

---

**Projet modernisé : React + PHP/MySQL**

Pour toute question, consulter le code ou ouvrir une issue.

