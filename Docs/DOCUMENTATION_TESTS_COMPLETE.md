# 🧪 Guide Complet des Tests - Journey Application

## 📸 Table des Matières

1. [🎯 Vue d'ensemble](#-vue-densemble)
2. [🚀 Démarrage Rapide](#-démarrage-rapide)
3. [📊 Système de Logging Automatique](#-système-de-logging-automatique)
4. [🛠️ Tests par Catégorie](#️-tests-par-catégorie)
5. [🎯 Tests Critiques](#-tests-critiques)
6. [📈 Couverture et Métriques](#-couverture-et-métriques)
7. [🚨 Résolution des Problèmes](#-résolution-des-problèmes)
8. [🔄 Intégration Continue](#-intégration-continue)
9. [📚 Ressources et Bonnes Pratiques](#-ressources-et-bonnes-pratiques)

---

## 🎯 Vue d'ensemble

Cette application utilise une stratégie de test pyramidale complète avec système de logging automatique :

- **70% Tests Unitaires** - Jest (Frontend) + PHPUnit (Backend)
- **20% Tests d'Intégration** - API endpoints et flux de données  
- **10% Tests E2E** - Selenium (Chrome, Firefox, Safari, Opera)
- **Logging automatique** - Rapports JSON/Markdown avec métriques de performance

### ✅ État Actuel - Entièrement Opérationnel

```
✅ Backend (PHPUnit) - 18 tests passent tous
✅ Frontend (Jest) - Configuré et fonctionnel avec polyfills
✅ E2E (Selenium) - Multi-navigateurs prêt à l'emploi
✅ Système de logging - Testé et validé
```

---

## 🚀 Démarrage Rapide

### Prérequis
```bash
# Versions requises
Node.js >= 14
PHP >= 7.4
Composer
WAMP/XAMPP (pour l'API)
Chrome + Firefox (pour Selenium)
```

### Installation Express
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && composer install
```

### Lancer Tous les Tests avec Logs

#### Option 1: Script Complet (Recommandé)
```bash
# Tests complets avec logs détaillés
node test-runner-with-logs.js

# Ou via npm
npm run test:with-logs

# Démo du système de logging (pour comprendre)
node test-demo-logs.js
```

#### Option 2: Scripts Individuels
```bash
# Windows - Script interactif
./run-tests.bat

# Linux/Mac - Script interactif  
./run-tests.sh
```

#### Option 3: Commandes Manuelles
```bash
npm test                    # Frontend
./vendor/bin/phpunit       # Backend
npm run test:selenium      # E2E
```

---

## 📊 Système de Logging Automatique

### 🎯 Fonctionnalités du Logging

Le système génère automatiquement des rapports détaillés avec :

- **Logs JSON** structurés pour l'analyse automatique
- **Rapports Markdown** lisibles pour review manuelle  
- **Screenshots automatiques** pour tests Selenium
- **Métriques de performance** et analyse des temps
- **Rapport maître** consolidant tous les types de tests
- **Logs temps réel** avec emojis et couleurs

### 📁 Structure des Fichiers Générés

```
test-logs/
├── master-report-2025-08-05_07-23-24.md     # Rapport principal
├── master-report-2025-08-05_07-23-24.json   # Données JSON
├── test-report-Jest-2025-08-05_07-23-16.md  # Frontend détaillé
├── test-report-PHPUnit-2025-08-05_07-23-18.md # Backend détaillé
├── test-report-Selenium-2025-08-05_07-23-24.md # E2E détaillé
└── screenshots/                              # Captures (si Selenium)
    ├── screenshot-inscription-error-2025-08-05.png
    └── screenshot-gestion-info-2025-08-05.png
```

### 🖥️ Exemple de Sortie Console en Temps Réel

```bash
🚀 JOURNEY - MASTER TEST RUNNER
==================================================
Running complete test suite with detailed logging...

📱 FRONTEND TESTS (Jest)
------------------------------
🧪 [UNIT] Starting: api.test.js
✅ [PASS] api.test.js
🧪 [UNIT] Starting: validation.test.js  
✅ [PASS] validation.test.js
ℹ️  INFO: Jest completed: 25 tests passed

🔧 BACKEND TESTS (PHPUnit)
------------------------------
✅ Backend: 18 tests, 89 assertions

🎭 E2E TESTS (Selenium)
------------------------------
🌐 Browser: chrome
📸 Screenshot saved: screenshot-inscription-info-2025-08-05.png
✅ [PASS] Inscription Flow [chrome]

============================================================
📊 MASTER TEST REPORT GENERATED
============================================================
📄 JSON Report: test-logs/master-report-2025-08-05T14-30-15.json
📝 MD Report:   test-logs/master-report-2025-08-05T14-30-15.md
⏱️  Total Duration: 45s
📈 Overall Success Rate: 94%
🎉 EXCELLENT! Test suite is in great shape!
============================================================
```

---

## 🛠️ Tests par Catégorie

### 1. Tests Unitaires Frontend (Jest)

**Localisation :** `frontend/src/**/*.test.js`

#### Validation des Données (`validation.test.js`)
```javascript
// Tests du système de créneaux
✅ 12 créneaux matin (9h00-12h40)  
✅ 6 créneaux après-midi (13h00-14h40)
✅ Créneaux critiques : 12h00, 12h20, 12h40

// Tests de validation
✅ Code personnel : /^[0-9]{7}[A-Za-z]{1}$/
✅ Nom/Prénom : minimum 2 caractères
✅ Nombre proches : 0-4 maximum
```

#### API Functions (`api.test.js`)
```javascript
✅ Requêtes GET/POST/DELETE
✅ Gestion des erreurs HTTP
✅ Timeouts et AbortSignal
✅ Structure des URLs (/backend/public/api.php)
```

#### Polyfills (`polyfills.test.js`)
```javascript
✅ AbortController (Safari < 16)
✅ String.prototype.at() 
✅ Array.prototype.at()
✅ Object.hasOwn()
```

#### Fallback Icons (`iconFallback.test.js`)
```javascript
✅ Détection navigateur (Safari, Opera, Chrome, Firefox)
✅ Support emoji (Canvas-based detection)
✅ Composant MaterialIconWithFallback
✅ Mapping icônes : check_circle → ✓, radio_button_unchecked → ○
```

**Commandes :**
```bash
npm test                           # Mode watch
npm test -- --watchAll=false     # Une fois
npm run test:coverage            # Avec couverture
```

### 2. Tests Unitaires Backend (PHPUnit)

**Localisation :** `backend/tests/Unit/**/*Test.php`

#### Validation Class (`ValidationTest.php`)
```php
✅ validateCodePersonnel() - Format 7 chiffres + 1 lettre
✅ validateNom()/validatePrenom() - Minimum 2 caractères
✅ validateNombreProches() - 0 à 4 proches maximum
✅ validateHeureArrivee() - 18 créneaux valides
✅ isMatinCreneau() - < '13:00'
✅ isApresMidiCreneau() - >= '13:00'
✅ getCreneauxMatin() - 12 slots
✅ getCreneauxApresMidi() - 6 slots
✅ validatePlacesDisponibles() - Calcul capacity
✅ validateAgent() - Validation complète
```

**Commandes :**
```bash
./vendor/bin/phpunit                     # Tous les tests
./vendor/bin/phpunit tests/Unit         # Tests unitaires
./vendor/bin/phpunit --testdox          # Format lisible
./vendor/bin/phpunit --coverage-html coverage  # Couverture
```

### 3. Tests d'Intégration (PHPUnit)

**Localisation :** `backend/tests/Integration/ApiTest.php`

#### Endpoints API
```php
✅ GET /creneaux - Structure matin/après-midi
✅ POST /agents - Création avec validation
✅ DELETE /agents - Suppression par code
✅ GET /stats - Statistiques complètes
✅ Gestion erreurs et validations
✅ Tests de doublons
```

**Commandes :**
```bash
./vendor/bin/phpunit tests/Integration
```

### 4. Tests E2E (Selenium)

**Localisation :** `frontend/tests/selenium/`

#### Configuration Multi-Navigateurs
```javascript
✅ Chrome (headless + interface)
✅ Firefox (geckodriver)
✅ Configuration timeouts
✅ Screenshots automatiques
✅ Gestion erreurs
```

#### Tests d'Inscription (`inscription.test.js`)
```javascript
✅ Affichage formulaire complet
✅ Validation des champs
✅ Sélection créneaux (18 slots)
✅ Workflow inscription complète
✅ Gestion erreurs API
✅ Tests responsive
```

#### Tests de Gestion (`gestion.test.js`)
```javascript
✅ Affichage statistiques
✅ Tableau créneaux correct
✅ Recherche agents
✅ Suppression agents
✅ Labels des périodes
✅ Design responsive
```

**Commandes :**
```bash
npm run test:selenium                    # Tous navigateurs
node tests/selenium/runner.js          # Runner custom
```

---

## 🎯 Tests Critiques

### ⚠️ Points de Vigilance Absolue

1. **Créneaux Horaires**
   ```javascript
   // OBLIGATOIRE : Ces créneaux doivent être présents
   const matinSlots = ['12:00', '12:20', '12:40'];  // Étaient manquants
   const totalSlots = 18; // 12 matin + 6 après-midi
   ```

2. **Détection Matin/Après-midi**
   ```javascript
   // CRITIQUE : Logique corrigée
   const isMatin = heure < '13:00';  // Avant: < '12:00' ❌
   ```

3. **Validation Code Personnel**
   ```javascript
   // FORMAT STRICT
   const isValid = /^[0-9]{7}[A-Za-z]{1}$/.test(code);
   // Exemples: '1234567A' ✅, '123456A' ❌, '1234567AB' ❌
   ```

4. **Compatibilité Navigateur**
   ```javascript
   // Safari < 16 : AbortSignal.timeout non supporté
   // Opera : Problèmes d'affichage icônes
   // Solution : Polyfills + fallbacks implémentés
   ```

### Fonctionnalités Clés Testées

1. **Système de Créneaux**
   - ✅ 18 créneaux total (12 matin + 6 après-midi)
   - ✅ Créneaux 12:00, 12:20, 12:40 présents
   - ✅ Détection matin/après-midi (< 13:00)

2. **Validation des Données**
   - ✅ Code personnel (7 chiffres + 1 lettre)
   - ✅ Nom/Prénom (minimum 2 caractères)
   - ✅ Nombre de proches (0-4)

3. **Compatibilité Navigateur**
   - ✅ Polyfills (AbortSignal, Array.at, String.at)
   - ✅ Fallback des icônes Material
   - ✅ Safari, Opera, Chrome, Firefox

4. **Gestion des Agents**
   - ✅ Inscription complète
   - ✅ Suppression d'agents
   - ✅ Validation des places disponibles

---

## 📈 Couverture et Métriques

### Objectifs de Couverture
```
Frontend : 70% minimum
Backend  : 70% minimum
E2E      : Workflows critiques
```

### Commandes de Couverture
```bash
# Frontend - Rapport HTML
npm run test:coverage
# ➜ frontend/coverage/lcov-report/index.html

# Backend - Rapport HTML  
./vendor/bin/phpunit --coverage-html coverage
# ➜ backend/coverage/index.html
```

### Métriques Clés à Surveiller

1. **Taux de Succès** - Objectif: > 90%
2. **Durée Totale** - Objectif: < 2 minutes
3. **Tests Instables** - Ceux qui échouent parfois
4. **Performance** - Tests > 5 secondes

---

## 🚨 Résolution des Problèmes

### Tests Frontend Échouent
```bash
# 1. Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install

# 2. Clear Jest cache
npm test -- --clearCache

# 3. Mode debug
npm test -- --verbose --no-cache
```

### Tests Backend Échouent
```bash
# 1. Vérifier PHP
php -v  # Doit être >= 7.4

# 2. Réinstaller dépendances
composer install --no-cache

# 3. Permissions
chmod +x vendor/bin/phpunit
```

### Tests Selenium Échouent
```bash
# 1. Vérifier drivers
chromedriver --version
geckodriver --version

# 2. Vérifier serveur
curl http://localhost:3000/journey  # Frontend doit tourner
curl http://localhost/journey/backend/public/api.php  # WAMP doit tourner

# 3. Mode non-headless pour debug
# Modifier webdriver.config.js: headless = false
```

### Erreurs Communes

| Erreur | Solution |
|--------|----------|
| `Cannot find module` | `npm install` ou `composer install` |
| `Port already in use` | Changer port ou fermer autre serveur |
| `WebDriver not found` | `npm install chromedriver geckodriver` |
| `Database connection failed` | Démarrer WAMP/XAMPP |
| `CORS errors` | Vérifier configuration API |
| `react-scripts not found` | `cd frontend && npm install` |

### Problèmes de Logging
```bash
# Logs non générés
ls -la test-logs/  # Vérifier permissions
mkdir -p test-logs && chmod 755 test-logs

# Screenshots manquants
export DISPLAY=:0  # Pour Selenium

# Rapports JSON corrompus
df -h  # Vérifier l'espace disque
```

---

## 🔄 Intégration Continue

### GitHub Actions (Exemple)
```yaml
name: Tests with Logging
on: [push, pull_request]

jobs:
  test-complete:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '16' }
      - uses: shivammathur/setup-php@v2
        with: { php-version: '7.4' }
      
      # Frontend
      - run: cd frontend && npm install
      - run: cd frontend && npm run test:coverage
      
      # Backend
      - run: cd backend && composer install
      - run: cd backend && ./vendor/bin/phpunit
      
      # Tests complets avec logs
      - run: node test-runner-with-logs.js
      
      # Upload des rapports
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-reports
          path: test-logs/
```

### Variables d'Environnement pour CI
```bash
# Niveau de log
export LOG_LEVEL=info    # debug, info, warn, error

# Répertoire de logs
export LOG_DIR=./test-logs

# Activer/désactiver screenshots  
export SCREENSHOTS=true

# Format de sortie
export LOG_FORMAT=both    # json, text, both
```

---

## 📚 Ressources et Bonnes Pratiques

### Documentation Officielle
- **Jest :** https://jestjs.io/docs/getting-started
- **PHPUnit :** https://phpunit.de/documentation.html
- **Selenium :** https://www.selenium.dev/documentation/
- **Testing Library :** https://testing-library.com/docs/react-testing-library/intro/

### Bonnes Pratiques

#### 1. Principes Fondamentaux
- **AAA Pattern :** Arrange, Act, Assert
- **Tests indépendants :** Pas de dépendances entre tests
- **Noms descriptifs :** `should_validate_code_personnel_with_correct_format`
- **Données de test :** Utilisez des constantes et helpers
- **Mock approprié :** Ne pas tester les dépendances externes

#### 2. Nommage des Tests
```javascript
// ✅ Bon
test('should validate code personnel with correct 7-digit format', () => {});

// ❌ Éviter  
test('validation test', () => {});
```

#### 3. Gestion des Screenshots
```javascript
// Prendre des screenshots aux moments clés
await logger.takeScreenshot(driver, 'before-form-submit', 'info');
await submitForm();
await logger.takeScreenshot(driver, 'after-form-submit', 'info');
```

#### 4. Logs Structurés
```javascript
// ✅ Bon - Données structurées
logger.logInfo('User action completed', {
  action: 'login',
  userId: 123,
  duration: 1500,
  success: true
});

// ❌ Éviter - String non structurée
logger.logInfo('User 123 logged in successfully in 1500ms');
```

### Scripts Utiles
```bash
# Tests rapides (< 30s)
npm test -- --passWithNoTests --watchAll=false
./vendor/bin/phpunit --no-coverage

# Tests complets avec rapports
npm run test:all
./run-tests.sh

# Nettoyage
rm -rf frontend/node_modules frontend/coverage
rm -rf backend/vendor backend/coverage
rm -rf test-logs/*
```

### Configuration Personnalisée du Logging

```javascript
// Dans vos tests
const logger = new TestLogger('custom-log-dir');
logger.setSuite('My Custom Suite');

// Log personnalisé
logger.logInfo('Starting custom validation', { param: 'value' });
logger.logWarning('This might be an issue');
logger.logError('Critical error occurred', error);
```

### Ajout de Nouveaux Tests

#### Test Unitaire Frontend
```javascript
// frontend/src/components/MonComposant.test.js
import { render, screen } from '@testing-library/react';
import MonComposant from './MonComposant';

test('should render correctly', () => {
  render(<MonComposant />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

#### Test Backend
```php
// backend/tests/Unit/MaClasseTest.php
<?php
namespace Journey\Tests\Unit;
use PHPUnit\Framework\TestCase;

class MaClasseTest extends TestCase {
    public function testMaFonction() {
        $this->assertTrue(true);
    }
}
```

#### Test E2E
```javascript
// frontend/tests/selenium/tests/montest.test.js
const WebDriverConfig = require('../config/webdriver.config');

describe('Mon Test', () => {
    let driver;
    
    beforeAll(async () => {
        driver = WebDriverConfig.createDriver('chrome');
    });
    
    test('should do something', async () => {
        await driver.get('http://localhost:3000');
        // Test logic
    });
});
```

---

## ✅ Checklist de Validation Finale

Avant de déployer :

- [ ] Tous les tests backend passent (18/18)
- [ ] Tests frontend sans erreurs critiques
- [ ] Tests E2E sur Chrome et Firefox
- [ ] Couverture >= 70% frontend et backend
- [ ] Créneaux 12h00, 12h20, 12h40 présents
- [ ] Validation code personnel fonctionnelle
- [ ] Polyfills Safari/Opera actifs
- [ ] Scripts de test fonctionnels
- [ ] Système de logging opérationnel
- [ ] Rapports générés correctement

---

## 📞 Support et Maintenance

### Mise à Jour des Tests
Quand vous modifiez le code, pensez à :
1. Mettre à jour les tests correspondants
2. Vérifier que tous les tests passent
3. Maintenir la couverture de code
4. Documenter les nouveaux tests
5. Vérifier les rapports de logging

### Support
Pour toute question :
1. **Consulter les logs** dans `test-logs/`
2. **Vérifier cette documentation**
3. **Examiner les exemples** dans les fichiers de test existants
4. **Utiliser la démo** : `node test-demo-logs.js`

---

**🎉 Votre application Journey dispose maintenant d'une suite de tests complète et robuste avec système de logging automatique professionnel !**

*Système testé et validé - Dernière mise à jour : Août 2025* ✅