const TestLogger = require('../logger');
const fs = require('fs');
const path = require('path');

class SeleniumLogger extends TestLogger {
    constructor() {
        super('test-logs');
        this.setSuite('Selenium E2E Tests');
        this.screenshots = [];
        this.browserInfo = {};
    }

    setBrowserInfo(browserName, version = 'unknown') {
        this.browserInfo = {
            name: browserName,
            version: version,
            timestamp: new Date().toISOString()
        };
        this.testResults.environment.browser = this.browserInfo;
    }

    async takeScreenshot(driver, testName, status = 'info') {
        try {
            const screenshot = await driver.takeScreenshot();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `screenshot-${testName}-${status}-${timestamp}.png`;
            const screenshotDir = path.join(this.logDir, 'screenshots');
            
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }
            
            const filepath = path.join(screenshotDir, filename);
            fs.writeFileSync(filepath, screenshot, 'base64');
            
            const screenshotInfo = {
                testName,
                status,
                filename,
                filepath,
                timestamp: new Date().toISOString(),
                size: fs.statSync(filepath).size
            };
            
            this.screenshots.push(screenshotInfo);
            console.log(`📸 Screenshot saved: ${filename}`);
            
            return screenshotInfo;
        } catch (error) {
            this.logError(`Failed to take screenshot for ${testName}`, error);
            return null;
        }
    }

    logTestStart(testName, category = 'e2e', browserName = 'unknown') {
        const fullTestName = `${testName} [${browserName}]`;
        super.logTestStart(fullTestName, category);
        console.log(`🌐 Browser: ${browserName}`);
    }

    logTestResult(testName, status, error = null, details = {}) {
        // Add browser info to details
        details.browser = this.browserInfo;
        details.screenshots = this.screenshots.filter(s => s.testName === testName);
        
        super.logTestResult(testName, status, error, details);
    }

    logPageLoad(url, loadTime) {
        this.logInfo(`Page loaded: ${url}`, { loadTime: `${loadTime}ms` });
    }

    logElementFound(selector, time) {
        this.logInfo(`Element found: ${selector}`, { findTime: `${time}ms` });
    }

    logUserAction(action, element, details = {}) {
        this.logInfo(`User action: ${action} on ${element}`, details);
    }

    logBrowserError(message, source, line) {
        this.logError(`Browser console error: ${message}`, { source, line });
    }

    generateMarkdownReport() {
        const baseReport = super.generateMarkdownReport();
        
        // Add browser-specific sections
        let seleniumSection = `
## 🌐 Browser Information

| Property | Value |
|----------|-------|
| **Browser** | ${this.browserInfo.name || 'Unknown'} |
| **Version** | ${this.browserInfo.version || 'Unknown'} |
| **Test Start** | ${this.browserInfo.timestamp || 'Unknown'} |

## 📸 Screenshots (${this.screenshots.length})

${this.screenshots.length > 0 ? this.screenshots.map(s => `
### ${s.status === 'error' ? '❌' : s.status === 'warning' ? '⚠️' : '📷'} ${s.testName}

- **Status:** ${s.status}
- **File:** \`${s.filename}\`
- **Size:** ${Math.round(s.size / 1024)}KB
- **Timestamp:** ${s.timestamp}
`).join('') : 'No screenshots taken.'}

## 🔍 E2E Specific Metrics

${this.generateE2EMetrics()}
`;

        // Insert before environment section
        const envIndex = baseReport.indexOf('## 🖥️ Environment');
        if (envIndex !== -1) {
            return baseReport.slice(0, envIndex) + seleniumSection + baseReport.slice(envIndex);
        }
        
        return baseReport + seleniumSection;
    }

    generateE2EMetrics() {
        const { details } = this.testResults;
        
        const pageLoads = details.filter(t => t.category === 'e2e').length;
        const avgTestDuration = details.length > 0 ? 
            details.reduce((sum, t) => sum + (t.duration || 0), 0) / details.length : 0;
        
        const browserTests = {};
        details.forEach(test => {
            if (test.details && test.details.browser) {
                const browser = test.details.browser.name;
                if (!browserTests[browser]) {
                    browserTests[browser] = { passed: 0, failed: 0, total: 0 };
                }
                browserTests[browser].total++;
                if (test.status === 'passed') {
                    browserTests[browser].passed++;
                } else if (test.status === 'failed') {
                    browserTests[browser].failed++;
                }
            }
        });

        let metrics = `**Page Loads:** ${pageLoads}\n`;
        metrics += `**Average Test Duration:** ${Math.round(avgTestDuration)}ms\n\n`;
        
        if (Object.keys(browserTests).length > 0) {
            metrics += `**Browser Test Results:**\n`;
            Object.entries(browserTests).forEach(([browser, results]) => {
                const successRate = results.total > 0 ? 
                    Math.round((results.passed / results.total) * 100) : 0;
                metrics += `- **${browser}:** ${results.passed}/${results.total} (${successRate}%)\n`;
            });
        }

        return metrics;
    }

    async logBrowserConsole(driver) {
        try {
            const logs = await driver.manage().logs().get('browser');
            logs.forEach(log => {
                if (log.level.name === 'SEVERE') {
                    this.logBrowserError(log.message, 'console', 0);
                } else if (log.level.name === 'WARNING') {
                    this.logWarning(`Browser console: ${log.message}`);
                }
            });
        } catch (error) {
            // Browser logging not supported or available
        }
    }

    async finalize() {
        // Add screenshot summary to results
        this.testResults.screenshots = {
            total: this.screenshots.length,
            byStatus: this.screenshots.reduce((acc, s) => {
                acc[s.status] = (acc[s.status] || 0) + 1;
                return acc;
            }, {}),
            totalSize: this.screenshots.reduce((sum, s) => sum + s.size, 0)
        };

        return super.finalize();
    }
}

module.exports = SeleniumLogger;