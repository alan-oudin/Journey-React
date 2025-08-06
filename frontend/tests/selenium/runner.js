const { execSync } = require('child_process');
const path = require('path');
const SeleniumLogger = require('./logger');

// Initialize logging
const logger = new SeleniumLogger();

console.log('🚀 Starting Selenium E2E Tests...\n');

// Configuration
const testDir = path.join(__dirname, 'tests');
const browsers = ['chrome', 'firefox'];
const testFiles = [
    'inscription.test.js',
    'gestion.test.js'
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runTest(testFile, browser = 'chrome') {
    const testName = `${testFile} on ${browser.toUpperCase()}`;
    logger.setBrowserInfo(browser);
    logger.logTestStart(testName, 'e2e', browser);
    
    try {
        const testPath = path.join(testDir, testFile);
        
        // Utiliser Jest pour exécuter les tests Selenium
        const command = `npx jest "${testPath}" --testTimeout=60000 --verbose`;
        
        // Définir les variables d'environnement pour le test
        const env = {
            ...process.env,
            SELENIUM_BROWSER: browser,
            NODE_ENV: 'test'
        };
        
        const result = execSync(command, {
            cwd: path.join(__dirname, '..', '..'),
            stdio: 'pipe',
            encoding: 'utf8',
            env: env
        });
        
        // Parser les résultats Jest
        const testMatches = result.match(/Tests:\s+(\d+)\s+passed/);
        const failMatches = result.match(/Tests:\s+\d+\s+failed/);
        
        if (failMatches) {
            logger.logTestResult(testName, 'failed', result);
            failedTests++;
            totalTests++;
        } else if (testMatches) {
            const passed = parseInt(testMatches[1]);
            logger.logTestResult(testName, 'passed', null, {
                testsRun: passed,
                output: result.substring(0, 500) // Limiter la sortie
            });
            passedTests += passed;
            totalTests += passed;
        }
        
    } catch (error) {
        const errorMsg = error.stdout || error.message;
        logger.logTestResult(testName, 'failed', errorMsg);
        
        failedTests++;
        totalTests++;
    }
}

async function runAllTests() {
    logger.logInfo('Starting Selenium test execution');
    
    // Vérifier que les drivers sont installés
    try {
        execSync('chromedriver --version', { stdio: 'pipe' });
        logger.logInfo('ChromeDriver found');
    } catch (error) {
        logger.logWarning('ChromeDriver not found - some tests may fail');
    }
    
    try {
        execSync('geckodriver --version', { stdio: 'pipe' });
        logger.logInfo('GeckoDriver found');
    } catch (error) {
        logger.logWarning('GeckoDriver not found - Firefox tests may fail');
    }
    
    logger.logInfo('Starting test execution across browsers');
    
    // Exécuter les tests pour chaque navigateur
    for (const browser of browsers) {
        logger.logInfo(`Testing on ${browser.toUpperCase()}`);
        
        for (const testFile of testFiles) {
            await runTest(testFile, browser);
        }
    }
    
    // Finaliser le logging
    const results = await logger.finalize();
    
    if (failedTests > 0) {
        logger.logError('Some tests failed. Check the detailed reports for more information.');
        process.exit(1);
    } else {
        logger.logInfo('All tests passed successfully!');
        process.exit(0);
    }
}

// Script principal
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('💥 Test runner failed:', error.message);
        process.exit(1);
    });
}

module.exports = {
    runTest,
    runAllTests
};