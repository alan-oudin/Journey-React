#!/bin/bash

# Script de génération du package de production Journey
# Usage: ./build-production.sh [version]

set -e  # Arrêt immédiat en cas d'erreur

# Configuration
VERSION=${1:-$(date +"%Y%m%d-%H%M%S")}
PROJECT_NAME="journey"
BUILD_DIR="dist"
PRODUCTION_DIR="${BUILD_DIR}/${PROJECT_NAME}-v${VERSION}"

echo "🚀 JOURNEY - SCRIPT DE BUILD PRODUCTION"
echo "========================================"
echo "📦 Version: ${VERSION}"
echo "📁 Destination: ${PRODUCTION_DIR}"
echo ""

# Nettoyage des builds précédents
echo "🧹 Nettoyage des builds précédents..."
rm -rf "${BUILD_DIR}"
mkdir -p "${PRODUCTION_DIR}"

# ===== BACKEND =====
echo ""
echo "🔧 BUILD BACKEND"
echo "----------------"

echo "📦 Installation des dépendances backend (production uniquement)..."
cd backend
composer install --no-dev --optimize-autoloader --no-interaction --quiet
cd ..

echo "📁 Copie des fichiers backend..."
mkdir -p "${PRODUCTION_DIR}/backend"

# Copie sélective des fichiers backend
cp -r backend/public "${PRODUCTION_DIR}/backend/"
cp -r backend/src "${PRODUCTION_DIR}/backend/"
cp -r backend/vendor "${PRODUCTION_DIR}/backend/"
cp backend/composer.json "${PRODUCTION_DIR}/backend/"
cp backend/composer.lock "${PRODUCTION_DIR}/backend/"

# Copie du fichier .env s'il existe
if [ -f "backend/.env" ]; then
    cp backend/.env "${PRODUCTION_DIR}/backend/"
    echo "✅ Fichier .env backend copié"
else
    echo "⚠️  Fichier backend/.env non trouvé - pensez à le créer sur le serveur"
fi

echo "✅ Backend prêt ($(du -sh "${PRODUCTION_DIR}/backend" | cut -f1))"

# ===== FRONTEND =====
echo ""
echo "📱 BUILD FRONTEND"
echo "-----------------"

echo "📦 Vérification des dépendances frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances frontend..."
    npm install --silent
else
    echo "✅ Dépendances déjà installées"
fi

echo "🏗️  Build du frontend optimisé..."
npm run build --silent
cd ..

echo "📁 Copie du build frontend à la racine..."
# Copie tous les fichiers du build à la racine du package
cp -r frontend/build/* "${PRODUCTION_DIR}/" 2>/dev/null || true

# Copie du .htaccess s'il existe
if [ -f ".htaccess" ]; then
    cp .htaccess "${PRODUCTION_DIR}/"
    echo "✅ .htaccess copié"
fi

echo "✅ Frontend prêt ($(du -sh "${PRODUCTION_DIR}" | cut -f1 | awk '{print $1}') - fichiers à la racine)"

# ===== DATABASE =====
echo ""
echo "🗄️  COPIE DATABASE"
echo "------------------"

if [ -d "backend/database" ]; then
    cp -r backend/database "${PRODUCTION_DIR}/"
    echo "✅ Scripts de base de données copiés"
else
    echo "⚠️  Dossier database non trouvé"
fi

# ===== DOCUMENTATION =====
echo ""
echo "📚 DOCUMENTATION"
echo "----------------"

# Seul le DEPLOYMENT.md est nécessaire en production
echo "⚠️  Documentation de développement exclue du package"

# Génération d'un README de déploiement
cat > "${PRODUCTION_DIR}/DEPLOYMENT.md" << 'EOF'
# Journey - Package de Production

## 📋 Contenu du package

```
journey-vXXXX/
├── index.html        # App React (racine)
├── .htaccess         # Configuration Apache
├── static/           # Assets CSS/JS
├── fonts/            # Polices
├── logo/             # Logos
├── manifest.json     # PWA manifest
├── robots.txt        # SEO
├── favicon.ico       # Icône
├── backend/          # API PHP
│   ├── .env          # Config BDD/CORS
│   ├── public/api.php # Point d'entrée API
│   ├── database/     # Scripts SQL
│   └── vendor/       # Dépendances PHP
└── DEPLOYMENT.md    # Instructions de déploiement
```

## 🔧 Génération du package

Ce package a été généré avec le script de build production :

```bash
# Sur Windows
scripts\build-production.bat [version]

# Sur Unix/Linux/Mac
./scripts/build-production.sh [version]
```

## 🚀 Instructions de déploiement

### 1. Serveur Web
- Copier le contenu sur votre serveur
- Configurer le DocumentRoot vers la racine du package
- Le .htaccess gère automatiquement le routage vers `/backend/public/api.php`

### 2. Base de données
- Importer `database/localhost_journee_proches.sql`
- Configurer les paramètres de connexion dans `backend/src/`

### 3. Permissions
```bash
chmod -R 755 backend/
chmod -R 644 frontend/
```

### 4. Configuration Apache/Nginx
Configurer selon votre environnement serveur.

## ℹ️ Informations

- **Version:** PLACEHOLDER_VERSION
- **Date de build:** PLACEHOLDER_DATE
- **Taille totale:** PLACEHOLDER_SIZE
- **Environment:** Production (optimisé)

EOF

# Remplacement des placeholders
sed -i "s/PLACEHOLDER_VERSION/${VERSION}/g" "${PRODUCTION_DIR}/DEPLOYMENT.md"
sed -i "s/PLACEHOLDER_DATE/$(date)/g" "${PRODUCTION_DIR}/DEPLOYMENT.md"

# ===== FINALISATION =====
echo ""
echo "📊 FINALISATION"
echo "---------------"

# Calcul de la taille totale
TOTAL_SIZE=$(du -sh "${PRODUCTION_DIR}" | cut -f1)
sed -i "s/PLACEHOLDER_SIZE/${TOTAL_SIZE}/g" "${PRODUCTION_DIR}/DEPLOYMENT.md"

# Génération d'un fichier d'informations
cat > "${PRODUCTION_DIR}/BUILD_INFO.json" << EOF
{
  "project": "Journey",
  "version": "${VERSION}",
  "build_date": "$(date -Iseconds)",
  "build_environment": "$(uname -a)",
  "components": {
    "backend": {
      "php_version": "$(php --version | head -n1)",
      "composer_version": "$(composer --version --no-ansi)"
    },
    "frontend": {
      "node_version": "$(node --version)",
      "npm_version": "$(npm --version)"
    }
  },
  "size": "${TOTAL_SIZE}",
  "files_count": $(find "${PRODUCTION_DIR}" -type f | wc -l)
}
EOF

# Création d'une archive (optionnel)
echo "📦 Création de l'archive..."
cd "${BUILD_DIR}"
tar -czf "${PROJECT_NAME}-v${VERSION}.tar.gz" "${PROJECT_NAME}-v${VERSION}/"
ARCHIVE_SIZE=$(du -sh "${PROJECT_NAME}-v${VERSION}.tar.gz" | cut -f1)
cd ..

echo ""
echo "🎉 BUILD TERMINÉ AVEC SUCCÈS !"
echo "=============================="
echo "📁 Package: ${PRODUCTION_DIR}"
echo "📦 Archive: ${BUILD_DIR}/${PROJECT_NAME}-v${VERSION}.tar.gz"
echo "💾 Taille dossier: ${TOTAL_SIZE}"
echo "📦 Taille archive: ${ARCHIVE_SIZE}"
echo "📄 Fichiers: $(find "${PRODUCTION_DIR}" -type f | wc -l)"
echo ""
echo "🚀 Prêt pour le déploiement !"
echo ""
echo "Pour déployer:"
echo "  1. Extraire l'archive sur le serveur cible"
echo "  2. Suivre les instructions dans DEPLOYMENT.md"
echo "  3. Configurer la base de données"
echo ""

# Affichage du contenu pour vérification
echo "📋 CONTENU DU PACKAGE:"
echo "----------------------"
tree "${PRODUCTION_DIR}" -L 3 2>/dev/null || find "${PRODUCTION_DIR}" -type d | head -20

echo ""
echo "✅ Script terminé - Package prêt dans: ${PRODUCTION_DIR}"