#!/bin/bash

echo "======================================================="
echo "               JOURNEY - SUITE DE TESTS"
echo "======================================================="
echo

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/frontend"
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backend"

echo -e "${BLUE}🔧 Vérification des prérequis...${NC}"
echo

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé ou pas dans le PATH${NC}"
    exit 1
fi

# Vérifier PHP
if ! command -v php &> /dev/null; then
    echo -e "${RED}❌ PHP n'est pas installé ou pas dans le PATH${NC}"
    exit 1
fi

# Vérifier Composer
if ! command -v composer &> /dev/null; then
    echo -e "${RED}❌ Composer n'est pas installé ou pas dans le PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tous les prérequis sont installés${NC}"
echo

# Installer les dépendances si nécessaire
echo -e "${BLUE}📦 Installation des dépendances...${NC}"
echo

echo "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur lors de l'installation des dépendances frontend${NC}"
        exit 1
    fi
fi

echo "Installing backend dependencies..."
cd "$BACKEND_DIR"
if [ ! -d "vendor" ]; then
    composer install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur lors de l'installation des dépendances backend${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Dépendances installées${NC}"
echo

# Fonction pour afficher le menu
show_menu() {
    echo "======================================================="
    echo "                     MENU DE TESTS"
    echo "======================================================="
    echo "1. Tests unitaires frontend (Jest)"
    echo "2. Tests backend (PHPUnit)"  
    echo "3. Tests d'intégration API"
    echo "4. Tests E2E (Selenium)"
    echo "5. Tous les tests"
    echo "6. Tests avec couverture"
    echo "7. Quitter"
    echo
}

# Fonction pour les tests frontend
run_frontend_tests() {
    echo
    echo -e "${BLUE}🧪 Exécution des tests unitaires frontend...${NC}"
    echo
    cd "$FRONTEND_DIR"
    npm test -- --watchAll=false --testPathPattern="src/"
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Tests frontend échoués${NC}"
        read -p "Appuyez sur Entrée pour continuer..."
    fi
}

# Fonction pour les tests backend
run_backend_tests() {
    echo
    echo -e "${BLUE}🧪 Exécution des tests backend...${NC}"
    echo
    cd "$BACKEND_DIR"
    vendor/bin/phpunit tests/Unit
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Tests backend échoués${NC}"
        read -p "Appuyez sur Entrée pour continuer..."
    fi
}

# Fonction pour les tests d'intégration
run_integration_tests() {
    echo
    echo -e "${BLUE}🔗 Exécution des tests d'intégration API...${NC}"
    echo
    cd "$BACKEND_DIR"
    vendor/bin/phpunit tests/Integration
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Tests d'intégration échoués${NC}"
        read -p "Appuyez sur Entrée pour continuer..."
    fi
}

# Fonction pour les tests E2E
run_e2e_tests() {
    echo
    echo -e "${BLUE}🎭 Exécution des tests E2E (Selenium)...${NC}"
    echo
    echo -e "${YELLOW}⚠️  Assurez-vous que votre serveur de développement est lancé (npm start)${NC}"
    echo -e "${YELLOW}    et que WAMP est démarré pour l'API${NC}"
    read -p "Appuyez sur Entrée pour continuer..."
    cd "$FRONTEND_DIR"
    npm run test:selenium
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Tests E2E échoués${NC}"
        read -p "Appuyez sur Entrée pour continuer..."
    fi
}

# Fonction pour tous les tests
run_all_tests() {
    echo
    echo -e "${BLUE}🚀 Exécution de tous les tests...${NC}"
    echo
    
    TESTS_FAILED=0
    
    echo "1/4 - Tests unitaires frontend..."
    cd "$FRONTEND_DIR"
    npm test -- --watchAll=false --testPathPattern="src/"
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Tests frontend échoués${NC}"
        TESTS_FAILED=1
    fi
    
    echo "2/4 - Tests backend..."
    cd "$BACKEND_DIR"
    vendor/bin/phpunit tests/Unit
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Tests backend échoués${NC}"
        TESTS_FAILED=1
    fi
    
    echo "3/4 - Tests d'intégration..."
    vendor/bin/phpunit tests/Integration
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Tests d'intégration échoués${NC}"
        TESTS_FAILED=1
    fi
    
    echo "4/4 - Tests E2E..."
    echo -e "${YELLOW}⚠️  Assurez-vous que votre serveur est lancé${NC}"
    cd "$FRONTEND_DIR"
    npm run test:selenium
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Tests E2E échoués${NC}"
        TESTS_FAILED=1
    fi
    
    echo
    if [ $TESTS_FAILED -eq 1 ]; then
        echo -e "${RED}❌ Certains tests ont échoué${NC}"
    else
        echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
    fi
    read -p "Appuyez sur Entrée pour continuer..."
}

# Fonction pour les tests avec couverture
run_coverage_tests() {
    echo
    echo -e "${BLUE}📊 Exécution des tests avec couverture...${NC}"
    echo
    
    echo "Frontend coverage..."
    cd "$FRONTEND_DIR"
    npm run test:coverage
    
    echo "Backend coverage..."
    cd "$BACKEND_DIR"
    vendor/bin/phpunit --coverage-html coverage
    
    echo
    echo -e "${GREEN}📈 Rapports de couverture générés :${NC}"
    echo "  Frontend : $FRONTEND_DIR/coverage/lcov-report/index.html"
    echo "  Backend  : $BACKEND_DIR/coverage/index.html"
    read -p "Appuyez sur Entrée pour continuer..."
}

# Boucle principale du menu
while true; do
    show_menu
    read -p "Choisissez une option (1-7): " choice
    
    case $choice in
        1)
            run_frontend_tests
            ;;
        2)
            run_backend_tests
            ;;
        3)
            run_integration_tests
            ;;
        4)
            run_e2e_tests
            ;;
        5)
            run_all_tests
            ;;
        6)
            run_coverage_tests
            ;;
        7)
            echo
            echo -e "${GREEN}👋 Au revoir !${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Option invalide${NC}"
            ;;
    esac
done