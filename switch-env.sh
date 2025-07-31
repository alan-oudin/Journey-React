#!/bin/bash
# Script pour basculer entre les environnements dev et prod
# Note: La gestion CORS est faite directement dans api.php via les fichiers .env

case "$1" in
    dev)
        echo "========================================"
        echo "ENVIRONNEMENT DEVELOPMENT (WAMP)"
        echo "========================================"
        echo "Frontend: http://localhost:3000"
        echo "Backend:  http://localhost:8080/journey/backend/public/api.php"
        echo "Base DB:  localhost:3306 (WAMP MySQL)"
        echo "CORS:     Configuré pour localhost:3000"
        echo "Config:   .env.development"
        echo ""
        echo "Vérifiez que WAMP est démarré !"
        echo "Lancez React avec: cd frontend && npm start"
        ;;
    prod)
        echo "========================================"
        echo "ENVIRONNEMENT PRODUCTION (XAMPP)"
        echo "========================================"
        echo "Frontend: https://tmtercvdl.sncf.fr/journey"
        echo "Backend:  http://127.0.0.1/journey/backend/public/api.php"
        echo "Base DB:  127.0.0.1:3306 (XAMPP MySQL)"
        echo "CORS:     Configuré pour tmtercvdl.sncf.fr"
        echo "Config:   .env.production"
        echo ""
        echo "Vérifiez que XAMPP est configuré sur le serveur !"
        echo "Buildez React avec: cd frontend && npm run build"
        ;;
    *)
        echo "Usage: ./switch-env.sh [dev|prod]"
        echo ""
        echo "  dev  - Affiche la configuration développement (WAMP)"
        echo "  prod - Affiche la configuration production (XAMPP)"
        echo ""
        echo "La configuration est automatique via les fichiers .env"
        echo ""
        exit 1
        ;;
esac