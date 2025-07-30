// Configuration des environnements
const config = {
  development: {
    API_BASE_URL: 'http://localhost:8080/journeyV2/backend/public/api.php',
    API_TIMEOUT: 10000,
    DEBUG: true
  },
  production: {
    API_BASE_URL: '/api/api.php',
    API_TIMEOUT: 30000,
    DEBUG: false
  },
  test: {
    API_BASE_URL: 'http://localhost:8080/journeyV2/backend/public/api.php',
    API_TIMEOUT: 5000,
    DEBUG: true
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