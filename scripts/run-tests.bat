@echo off
echo =======================================================
echo               JOURNEY - SUITE DE TESTS
echo =======================================================
echo.

set "FRONTEND_DIR=%~dp0frontend"
set "BACKEND_DIR=%~dp0backend"

echo 🔧 Vérification des prérequis...
echo.

:: Vérifier Node.js
where node >NUL 2>NUL
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js n'est pas installé ou pas dans le PATH
    pause
    exit /b 1
)

:: Vérifier PHP
where php >NUL 2>NUL
if %ERRORLEVEL% neq 0 (
    echo ❌ PHP n'est pas installé ou pas dans le PATH
    pause
    exit /b 1
)

:: Vérifier Composer
where composer >NUL 2>NUL
if %ERRORLEVEL% neq 0 (
    echo ❌ Composer n'est pas installé ou pas dans le PATH
    pause
    exit /b 1
)

echo ✅ Tous les prérequis sont installés
echo.

:: Installer les dépendances si nécessaire
echo 📦 Installation des dépendances...
echo.

echo Installing frontend dependencies...
cd /d "%FRONTEND_DIR%"
if not exist "node_modules" (
    npm install
    if %ERRORLEVEL% neq 0 (
        echo ❌ Erreur lors de l'installation des dépendances frontend
        pause
        exit /b 1
    )
)

echo Installing backend dependencies...
cd /d "%BACKEND_DIR%"
if not exist "vendor" (
    composer install
    if %ERRORLEVEL% neq 0 (
        echo ❌ Erreur lors de l'installation des dépendances backend
        pause
        exit /b 1
    )
)

echo ✅ Dépendances installées
echo.

:: Menu de sélection
:MENU
echo =======================================================
echo                     MENU DE TESTS
echo =======================================================
echo 1. Tests unitaires frontend (Jest)
echo 2. Tests backend (PHPUnit)  
echo 3. Tests d'intégration API
echo 4. Tests E2E (Selenium)
echo 5. Tous les tests
echo 6. Tests avec couverture
echo 7. Quitter
echo.
set /p choice=Choisissez une option (1-7): 

if "%choice%"=="1" goto FRONTEND_UNIT
if "%choice%"=="2" goto BACKEND_UNIT
if "%choice%"=="3" goto API_INTEGRATION
if "%choice%"=="4" goto E2E_TESTS
if "%choice%"=="5" goto ALL_TESTS
if "%choice%"=="6" goto COVERAGE_TESTS
if "%choice%"=="7" goto EXIT

echo ❌ Option invalide
goto MENU

:FRONTEND_UNIT
echo.
echo 🧪 Exécution des tests unitaires frontend...
echo.
cd /d "%FRONTEND_DIR%"
npm test -- --watchAll=false --testPathPattern="src/"
if %ERRORLEVEL% neq 0 (
    echo ❌ Tests frontend échoués
    pause
)
goto MENU

:BACKEND_UNIT
echo.
echo 🧪 Exécution des tests backend...
echo.
cd /d "%BACKEND_DIR%"
vendor\bin\phpunit tests\Unit
if %ERRORLEVEL% neq 0 (
    echo ❌ Tests backend échoués
    pause
)
goto MENU

:API_INTEGRATION
echo.
echo 🔗 Exécution des tests d'intégration API...
echo.
cd /d "%BACKEND_DIR%"
vendor\bin\phpunit tests\Integration
if %ERRORLEVEL% neq 0 (
    echo ❌ Tests d'intégration échoués
    pause
)
goto MENU

:E2E_TESTS
echo.
echo 🎭 Exécution des tests E2E (Selenium)...
echo.
echo ⚠️  Assurez-vous que votre serveur de développement est lancé (npm start)
echo    et que WAMP est démarré pour l'API
pause
cd /d "%FRONTEND_DIR%"
npm run test:selenium
if %ERRORLEVEL% neq 0 (
    echo ❌ Tests E2E échoués
    pause
)
goto MENU

:ALL_TESTS
echo.
echo 🚀 Exécution de tous les tests...
echo.

echo 1/4 - Tests unitaires frontend...
cd /d "%FRONTEND_DIR%"
npm test -- --watchAll=false --testPathPattern="src/"
if %ERRORLEVEL% neq 0 (
    echo ❌ Tests frontend échoués
    set "TESTS_FAILED=1"
)

echo 2/4 - Tests backend...
cd /d "%BACKEND_DIR%"
vendor\bin\phpunit tests\Unit
if %ERRORLEVEL% neq 0 (
    echo ❌ Tests backend échoués
    set "TESTS_FAILED=1"
)

echo 3/4 - Tests d'intégration...
vendor\bin\phpunit tests\Integration
if %ERRORLEVEL% neq 0 (
    echo ❌ Tests d'intégration échoués
    set "TESTS_FAILED=1"
)

echo 4/4 - Tests E2E...
echo ⚠️  Assurez-vous que votre serveur est lancé
cd /d "%FRONTEND_DIR%"
npm run test:selenium
if %ERRORLEVEL% neq 0 (
    echo ❌ Tests E2E échoués
    set "TESTS_FAILED=1"
)

if defined TESTS_FAILED (
    echo.
    echo ❌ Certains tests ont échoué
) else (
    echo.
    echo ✅ Tous les tests sont passés !
)
pause
goto MENU

:COVERAGE_TESTS
echo.
echo 📊 Exécution des tests avec couverture...
echo.

echo Frontend coverage...
cd /d "%FRONTEND_DIR%"
npm run test:coverage

echo Backend coverage...
cd /d "%BACKEND_DIR%"
vendor\bin\phpunit --coverage-html coverage

echo.
echo 📈 Rapports de couverture générés :
echo   Frontend : %FRONTEND_DIR%\coverage\lcov-report\index.html
echo   Backend  : %BACKEND_DIR%\coverage\index.html
pause
goto MENU

:EXIT
echo.
echo 👋 Au revoir !
exit /b 0