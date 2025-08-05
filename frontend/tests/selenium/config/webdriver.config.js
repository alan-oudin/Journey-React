const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const edge = require('selenium-webdriver/edge');

class WebDriverConfig {
    static createDriver(browserName = 'chrome', headless = false) {
        let driver;
        
        switch (browserName.toLowerCase()) {
            case 'chrome':
                const chromeOptions = new chrome.Options();
                if (headless) {
                    chromeOptions.addArguments('--headless');
                }
                chromeOptions.addArguments('--no-sandbox');
                chromeOptions.addArguments('--disable-dev-shm-usage');
                chromeOptions.addArguments('--disable-web-security');
                chromeOptions.addArguments('--allow-running-insecure-content');
                
                driver = new Builder()
                    .forBrowser('chrome')
                    .setChromeOptions(chromeOptions)
                    .build();
                break;
                
            case 'firefox':
                const firefoxOptions = new firefox.Options();
                if (headless) {
                    firefoxOptions.addArguments('--headless');
                }
                firefoxOptions.setPreference('security.tls.insecure_fallback_hosts', 'localhost');
                
                driver = new Builder()
                    .forBrowser('firefox')
                    .setFirefoxOptions(firefoxOptions)
                    .build();
                break;
                
            case 'edge':
                driver = new Builder()
                    .forBrowser('edge')
                    .build();
                break;
                
            default:
                throw new Error(`Browser ${browserName} not supported`);
        }
        
        // Configuration commune
        driver.manage().setTimeouts({
            implicit: 10000,
            pageLoad: 30000,
            script: 30000
        });
        
        return driver;
    }
    
    static async takeScreenshot(driver, filename) {
        try {
            const screenshot = await driver.takeScreenshot();
            const fs = require('fs');
            const path = require('path');
            
            const screenshotDir = path.join(__dirname, '..', 'screenshots');
            if (!fs.existsSync(screenshotDir)) {
                fs.mkdirSync(screenshotDir, { recursive: true });
            }
            
            const filepath = path.join(screenshotDir, `${filename}-${Date.now()}.png`);
            fs.writeFileSync(filepath, screenshot, 'base64');
            
            console.log(`Screenshot saved: ${filepath}`);
        } catch (error) {
            console.error('Failed to take screenshot:', error);
        }
    }
    
    static async waitForElement(driver, locator, timeout = 10000) {
        const { until, By } = require('selenium-webdriver');
        
        try {
            const element = await driver.wait(until.elementLocated(locator), timeout);
            await driver.wait(until.elementIsVisible(element), timeout);
            return element;
        } catch (error) {
            await this.takeScreenshot(driver, 'wait-for-element-failed');
            throw error;
        }
    }
    
    static async waitForCustomElement(driver, tagName, timeout = 10000) {
        // Attendre que les custom elements WCS soient définis
        await driver.executeScript(`
            return customElements.whenDefined('${tagName}');
        `);
        
        // Attendre un peu plus pour que l'élément soit complètement rendu
        await driver.sleep(500);
    }
}

module.exports = WebDriverConfig;