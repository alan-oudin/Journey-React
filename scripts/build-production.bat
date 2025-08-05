@echo off
REM Script de génération du package de production Journey (Windows)
REM Usage: build-production.bat [version]

setlocal enabledelayedexpansion

REM Configuration
if "%1"=="" (
    for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set mydate=%%c%%a%%b
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a%%b
    set VERSION=!mydate!-!mytime!
) else (
    set VERSION=%1
)

set PROJECT_NAME=journey
set BUILD_DIR=dist
set PRODUCTION_DIR=%BUILD_DIR%\%PROJECT_NAME%-v%VERSION%

echo 🚀 JOURNEY - SCRIPT DE BUILD PRODUCTION
echo ========================================
echo 📦 Version: %VERSION%
echo 📁 Destination: %PRODUCTION_DIR%
echo.

REM Nettoyage des builds précédents
echo 🧹 Nettoyage des builds précédents...
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%PRODUCTION_DIR%"

REM ===== BACKEND =====
echo.
echo 🔧 BUILD BACKEND
echo ----------------

echo 📦 Installation des dépendances backend (production uniquement)...
cd backend
call composer install --no-dev --optimize-autoloader --no-interaction --quiet
if errorlevel 1 (
    echo ❌ Erreur lors de l'installation des dépendances backend
    exit /b 1
)
cd ..

echo 📁 Copie des fichiers backend...
mkdir "%PRODUCTION_DIR%\backend"

REM Copie sélective des fichiers backend
xcopy /E /I /Q backend\public "%PRODUCTION_DIR%\backend\public"
xcopy /E /I /Q backend\src "%PRODUCTION_DIR%\backend\src"
xcopy /E /I /Q backend\vendor "%PRODUCTION_DIR%\backend\vendor"
copy backend\composer.json "%PRODUCTION_DIR%\backend\"
copy backend\composer.lock "%PRODUCTION_DIR%\backend\"

REM Copie du fichier .env s'il existe
if exist "backend\.env" (
    copy backend\.env "%PRODUCTION_DIR%\backend\"
    echo ✅ Fichier .env backend copié
) else (
    echo ⚠️  Fichier backend\.env non trouvé - pensez à le créer sur le serveur
)

echo ✅ Backend prêt

REM ===== FRONTEND =====
echo.
echo 📱 BUILD FRONTEND
echo -----------------

echo 📦 Vérification des dépendances frontend...
cd frontend
if not exist "node_modules" (
    echo 📦 Installation des dépendances frontend...
    call npm install --silent
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation des dépendances frontend
        exit /b 1
    )
) else (
    echo ✅ Dépendances déjà installées
)

echo 🏗️  Build du frontend optimisé...
call npm run build --silent
if errorlevel 1 (
    echo ❌ Erreur lors du build frontend
    exit /b 1
)
cd ..

echo 📁 Copie du build frontend à la racine...
REM Copie tous les fichiers du build à la racine du package
xcopy /E /I /Q /Y frontend\build\* "%PRODUCTION_DIR%\"

REM Copie du .htaccess s'il existe
if exist ".htaccess" (
    copy .htaccess "%PRODUCTION_DIR%\"
    echo ✅ .htaccess copié
)

echo ✅ Frontend prêt - fichiers à la racine

REM ===== DATABASE =====
echo.
echo 🗄️  COPIE DATABASE
echo ------------------

if exist "backend\database" (
    xcopy /E /I /Q backend\database "%PRODUCTION_DIR%\database"
    echo ✅ Scripts de base de données copiés
) else (
    echo ⚠️  Dossier database non trouvé
)

REM ===== DOCUMENTATION =====
echo.
echo 📚 DOCUMENTATION
echo ----------------

REM Seul le DEPLOYMENT.md est nécessaire en production
echo ⚠️  Documentation de développement exclue du package

REM Génération d'un README de déploiement
(
echo # Journey - Package de Production
echo.
echo ## 📋 Contenu du package
echo.
echo ```
echo journey-vXXXX/
echo ├── index.html        # App React ^(racine^)
echo ├── .htaccess         # Configuration Apache
echo ├── static/           # Assets CSS/JS
echo ├── fonts/            # Polices
echo ├── logo/             # Logos
echo ├── manifest.json     # PWA manifest
echo ├── robots.txt        # SEO
echo ├── favicon.ico       # Icône
echo ├── backend/          # API PHP
echo │   ├── .env          # Config BDD/CORS
echo │   ├── public/api.php # Point d'entrée API
echo │   ├── database/     # Scripts SQL
echo │   └── vendor/       # Dépendances PHP
echo └── DEPLOYMENT.md    # Instructions de déploiement
echo ```
echo.
echo ## 🔧 Génération du package
echo.
echo Ce package a été généré avec le script de build production :
echo.
echo ```bash
echo # Sur Windows
echo scripts\build-production.bat [version]
echo.
echo # Sur Unix/Linux/Mac
echo ./scripts/build-production.sh [version]
echo ```
echo.
echo ## 🚀 Instructions de déploiement
echo.
echo ### 1. Serveur Web
echo - Copier le contenu sur votre serveur
echo - Configurer le DocumentRoot vers la racine du package
echo - Le .htaccess gère automatiquement le routage vers `/backend/public/api.php`
echo.
echo ### 2. Base de données
echo - Importer `database/localhost_journee_proches.sql`
echo - Configurer les paramètres de connexion dans `backend/src/`
echo.
echo ### 3. Permissions
echo ```bash
echo chmod -R 755 backend/
echo chmod -R 644 frontend/
echo ```
echo.
echo ### 4. Configuration Apache/Nginx
echo Configurer selon votre environnement serveur.
echo.
echo ## ℹ️ Informations
echo.
echo - **Version:** %VERSION%
echo - **Date de build:** %DATE% %TIME%
echo - **Environment:** Production ^(optimisé^)
) > "%PRODUCTION_DIR%\DEPLOYMENT.md"

REM Génération d'un fichier d'informations
(
echo {
echo   "project": "Journey",
echo   "version": "%VERSION%",
echo   "build_date": "%DATE% %TIME%",
echo   "build_environment": "Windows",
echo   "components": {
echo     "backend": {
echo       "composer_version": "composer"
echo     },
echo     "frontend": {
echo       "node_version": "node",
echo       "npm_version": "npm"
echo     }
echo   }
echo }
) > "%PRODUCTION_DIR%\BUILD_INFO.json"

REM ===== FINALISATION =====
echo.
echo 📊 FINALISATION
echo ---------------

REM Création d'une archive ZIP (optionnel)
echo 📦 Création de l'archive...
powershell -command "Compress-Archive -Path '%PRODUCTION_DIR%' -DestinationPath '%BUILD_DIR%\%PROJECT_NAME%-v%VERSION%.zip' -Force"

echo.
echo 🎉 BUILD TERMINÉ AVEC SUCCÈS !
echo ==============================
echo 📁 Package: %PRODUCTION_DIR%
echo 📦 Archive: %BUILD_DIR%\%PROJECT_NAME%-v%VERSION%.zip
echo.
echo 🚀 Prêt pour le déploiement !
echo.
echo Pour déployer:
echo   1. Extraire l'archive sur le serveur cible
echo   2. Suivre les instructions dans DEPLOYMENT.md
echo   3. Configurer la base de données
echo.

REM Affichage du contenu pour vérification
echo 📋 CONTENU DU PACKAGE:
echo ----------------------
dir "%PRODUCTION_DIR%" /B

echo.
echo ✅ Script terminé - Package prêt dans: %PRODUCTION_DIR%

pause