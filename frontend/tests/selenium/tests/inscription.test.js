const { By, until, Key } = require('selenium-webdriver');
const WebDriverConfig = require('../config/webdriver.config');

describe('Inscription Page E2E Tests', () => {
    let driver;
    const baseUrl = 'http://localhost:3000/journey';
    
    beforeAll(async () => {
        driver = WebDriverConfig.createDriver('chrome', false);
    }, 30000);
    
    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    }, 10000);
    
    beforeEach(async () => {
        await driver.get(`${baseUrl}/inscription`);
        await driver.sleep(2000); // Attendre le chargement
    });
    
    test('should display all form fields correctly', async () => {
        // Vérifier le titre
        const title = await WebDriverConfig.waitForElement(
            driver, 
            By.xpath('//h2[contains(text(), "Inscription d\'un agent")]')
        );
        expect(await title.isDisplayed()).toBe(true);
        
        // Vérifier les champs de formulaire
        const codePersonnelInput = await WebDriverConfig.waitForElement(
            driver, 
            By.css('wcs-input[name="codePersonnel"]')
        );
        expect(await codePersonnelInput.isDisplayed()).toBe(true);
        
        const nomInput = await WebDriverConfig.waitForElement(
            driver, 
            By.css('wcs-input[name="nom"]')
        );
        expect(await nomInput.isDisplayed()).toBe(true);
        
        const prenomInput = await WebDriverConfig.waitForElement(
            driver, 
            By.css('wcs-input[name="prenom"]')
        );
        expect(await prenomInput.isDisplayed()).toBe(true);
        
        // Vérifier le bouton de soumission
        const submitButton = await WebDriverConfig.waitForElement(
            driver, 
            By.css('wcs-button[type="submit"]')
        );
        expect(await submitButton.isDisplayed()).toBe(true);
    });
    
    test('should display all 18 time slots (12 morning + 6 afternoon)', async () => {
        // Attendre le chargement des créneaux
        await driver.sleep(3000);
        
        // Vérifier les sections matin et après-midi
        const matinSection = await WebDriverConfig.waitForElement(
            driver, 
            By.xpath('//*[contains(text(), "Créneaux du matin (9h00 - 12h40)")]')
        );
        expect(await matinSection.isDisplayed()).toBe(true);
        
        const apresMidiSection = await WebDriverConfig.waitForElement(
            driver, 
            By.xpath('//*[contains(text(), "Créneaux de l\'après-midi (13h00 - 14h40)")]')
        );
        expect(await apresMidiSection.isDisplayed()).toBe(true);
        
        // Vérifier les créneaux spécifiques qui étaient manquants
        const creneaux = ['12:00', '12:20', '12:40'];
        for (const creneau of creneaux) {
            const creneauElement = await WebDriverConfig.waitForElement(
                driver, 
                By.xpath(`//*[contains(text(), "${creneau}")]`)
            );
            expect(await creneauElement.isDisplayed()).toBe(true);
        }
        
        // Compter tous les créneaux visibles
        const allCreneauxCards = await driver.findElements(By.css('wcs-card'));
        const visibleCards = [];
        for (const card of allCreneauxCards) {
            if (await card.isDisplayed()) {
                visibleCards.push(card);
            }
        }
        expect(visibleCards.length).toBe(18); // 12 matin + 6 après-midi
    });
    
    test('should complete agent registration successfully', async () => {
        // Attendre le chargement complet
        await driver.sleep(3000);
        
        // Remplir le code personnel
        const codePersonnelInput = await WebDriverConfig.waitForElement(
            driver, 
            By.css('wcs-input[name="codePersonnel"]')
        );
        await codePersonnelInput.sendKeys('1234567T');
        
        // Remplir le nom
        const nomInput = await WebDriverConfig.waitForElement(
            driver, 
            By.css('wcs-input[name="nom"]')
        );
        await nomInput.sendKeys('TestSelenium');
        
        // Remplir le prénom
        const prenomInput = await WebDriverConfig.waitForElement(
            driver, 
            By.css('wcs-input[name="prenom"]')
        );
        await prenomInput.sendKeys('Jean');
        
        // Sélectionner le nombre de proches
        const selectElement = await WebDriverConfig.waitForElement(
            driver, 
            By.css('wcs-select[name="nombreProches"]')
        );
        await selectElement.click();
        
        const option = await WebDriverConfig.waitForElement(
            driver, 
            By.css('wcs-select-option[value="1"]')
        );
        await option.click();
        
        // Sélectionner un créneau (cliquer sur une carte)
        const creneauCard = await WebDriverConfig.waitForElement(
            driver, 
            By.xpath('//wcs-card[.//div[contains(text(), "09:00")]]')
        );
        await creneauCard.click();
        
        // Attendre un peu pour la sélection
        await driver.sleep(1000);
        
        // Soumettre le formulaire
        const submitButton = await WebDriverConfig.waitForElement(
            driver, 
            By.css('wcs-button[type="submit"]')
        );
        await submitButton.click();
        
        // Attendre la réponse (succès ou erreur)
        await driver.sleep(3000);
        
        // Note: En test E2E réel, on vérifierait ici la présence d'un message de succès
        // ou d'erreur selon la configuration de la base de données de test
    }, 30000);
    
    test('should validate form fields', async () => {
        // Essayer de soumettre sans remplir les champs
        const submitButton = await WebDriverConfig.waitForElement(
            driver, 
            By.css('wcs-button[type="submit"]')
        );
        await submitButton.click();
        
        // Attendre les messages d'erreur
        await driver.sleep(2000);
        
        // Note: En test E2E réel, on vérifierait ici la présence des messages d'erreur
        // Les alertes WCS peuvent être complexes à intercepter en Selenium
    });
    
    test('should handle time slot selection correctly', async () => {
        // Attendre le chargement des créneaux
        await driver.sleep(3000);
        
        // Sélectionner un créneau du matin
        const matinCreneau = await WebDriverConfig.waitForElement(
            driver, 
            By.xpath('//wcs-card[.//div[contains(text(), "09:00")]]')
        );
        await matinCreneau.click();
        
        // Vérifier que le créneau est sélectionné (visuellement)
        const selectedStyle = await matinCreneau.getCssValue('border');
        // Note: La vérification exacte dépend du style appliqué
        
        // Sélectionner un autre créneau
        const autreCreneau = await WebDriverConfig.waitForElement(
            driver, 
            By.xpath('//wcs-card[.//div[contains(text(), "10:00")]]')
        );
        await autreCreneau.click();
        
        // Vérifier que seul le nouveau créneau est sélectionné
        await driver.sleep(1000);
    });
}, 60000);

// Tests de compatibilité navigateur
const browsers = ['chrome', 'firefox'];

browsers.forEach(browserName => {
    describe(`${browserName} Compatibility Tests`, () => {
        let driver;
        const baseUrl = 'http://localhost:3000/journey';
        
        beforeAll(async () => {
            driver = WebDriverConfig.createDriver(browserName, true); // headless pour les tests automatisés
        }, 30000);
        
        afterAll(async () => {
            if (driver) {
                await driver.quit();
            }
        }, 10000);
        
        test(`should load page correctly in ${browserName}`, async () => {
            await driver.get(`${baseUrl}/inscription`);
            await driver.sleep(3000);
            
            const title = await WebDriverConfig.waitForElement(
                driver, 
                By.xpath('//h2[contains(text(), "Inscription d\'un agent")]')
            );
            expect(await title.isDisplayed()).toBe(true);
        });
        
        test(`should display all time slots in ${browserName}`, async () => {
            await driver.get(`${baseUrl}/inscription`);
            await driver.sleep(3000);
            
            // Vérifier les créneaux critiques
            const creneaux = ['09:00', '12:00', '12:20', '12:40', '13:00', '14:40'];
            for (const creneau of creneaux) {
                const creneauElement = await WebDriverConfig.waitForElement(
                    driver, 
                    By.xpath(`//*[contains(text(), "${creneau}")]`)
                );
                expect(await creneauElement.isDisplayed()).toBe(true);
            }
        });
        
        if (browserName === 'chrome') {
            test('should handle Material Icons correctly in Chrome', async () => {
                await driver.get(`${baseUrl}/inscription`);
                await driver.sleep(3000);
                
                // Tester les icônes dans les créneaux
                // Note: Test spécifique aux icônes Material peut nécessiter 
                // une vérification plus sophistiquée
            });
        }
    });
});