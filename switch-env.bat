@echo off
REM Script pour basculer entre les environnements dev et prod
REM Note: La gestion CORS est faite directement dans api.php via les fichiers .env

if "%1"=="dev" goto dev
if "%1"=="prod" goto prod
goto help

:dev
echo ========================================
echo ENVIRONNEMENT DEVELOPMENT (WAMP)
echo ========================================
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8080/journey/backend/public/api.php  
echo Base DB:  localhost:3306 (WAMP MySQL)
echo CORS:     Configuré pour localhost:3000
echo Config:   .env.development
echo.
echo Vérifiez que WAMP est démarré !
echo Lancez React avec: cd frontend && npm start
goto end

:prod
echo ========================================
echo ENVIRONNEMENT PRODUCTION (XAMPP)  
echo ========================================
echo Frontend: https://tmtercvdl.sncf.fr/journey
echo Backend:  http://127.0.0.1/journey/backend/public/api.php
echo Base DB:  127.0.0.1:3306 (XAMPP MySQL)
echo CORS:     Configuré pour tmtercvdl.sncf.fr
echo Config:   .env.production
echo.
echo Vérifiez que XAMPP est configuré sur le serveur !
echo Buildez React avec: cd frontend && npm run build
goto end

:help
echo Usage: switch-env.bat [dev|prod]
echo.
echo   dev  - Affiche la configuration développement (WAMP)
echo   prod - Affiche la configuration production (XAMPP)
echo.
echo La configuration est automatique via les fichiers .env
echo.

:end