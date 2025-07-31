// Configuration des environnements
const config = {
  development: {
    // Configuration DEV - WAMP local
    API_BASE_URL: 'http://localhost:8080/journey/backend/public/api.php',
    FRONTEND_URL: 'http://localhost:3000',
    API_TIMEOUT: 10000,
    DEBUG: true,
    ENVIRONMENT_NAME: 'Development (WAMP)'
  },
  production: {
    // Configuration PROD - XAMPP sur serveur
    API_BASE_URL: 'http://127.0.0.1/journey/backend/public/api.php',
    FRONTEND_URL: 'https://tmtercvdl.sncf.fr/journey',
    API_TIMEOUT: 30000,
    DEBUG: false,
    ENVIRONMENT_NAME: 'Production (XAMPP)'
  },
  test: {
    API_BASE_URL: 'http://localhost:8080/journey/backend/public/api.php',
    FRONTEND_URL: 'http://localhost:3000',
    API_TIMEOUT: 5000,
    DEBUG: true,
    ENVIRONMENT_NAME: 'Test (WAMP)'
  }
};

// Détermine l'environnement actuel
const getEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  if (process.env.NODE_ENV === 'test') {
    return 'test';
  }
  return 'development';
};

// Export de la configuration actuelle
const currentEnv = getEnvironment();
export const ENV_CONFIG = config[currentEnv];

// Export pour debugging
export const CURRENT_ENVIRONMENT = currentEnv;

// Helper pour logger en développement uniquement
export const devLog = (...args) => {
  if (ENV_CONFIG.DEBUG) {
    console.log('[DEV]', ...args);
  }
};

export default ENV_CONFIG;