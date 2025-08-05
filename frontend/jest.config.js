module.exports = {
  // Configuration de base pour Create React App
  preset: 'react-scripts/config/jest/jestPreset.js',
  
  // Environnement de test
  testEnvironment: 'jsdom',
  
  // Fichiers de configuration
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Patterns de test
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
    '<rootDir>/tests/selenium/**/*.test.js'
  ],
  
  // Modules à transformer
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.css$': 'react-scripts/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': 'react-scripts/config/jest/fileTransform.js'
  },
  
  // Modules à ignorer lors de la transformation
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  
  // Configuration des modules
  moduleNameMapping: {
    '^react-native$': 'react-native-web',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy'
  },
  
  // Extensions de fichiers
  moduleFileExtensions: [
    'web.js',
    'js',
    'web.ts',
    'ts',
    'web.tsx',
    'tsx',
    'json',
    'web.jsx',
    'jsx',
    'node'
  ],
  
  // Configuration de couverture
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/serviceWorker.js',
    '!src/setupTests.js'
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Variables d'environnement pour les tests
  setupFiles: [
    'react-app-polyfill/jsdom'
  ],
  
  // Configuration spécifique pour Selenium
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
      ],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'selenium',
      testMatch: [
        '<rootDir>/tests/selenium/**/*.test.js'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: [],
      transform: {
        '^.+\\.(js)$': 'babel-jest'
      }
    }
  ],
  
  // Timeouts
  testTimeout: 120000,
  
  // Reporter pour de meilleurs logs
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }]
  ],
  
  // Nettoyage automatique des mocks
  clearMocks: true,
  restoreMocks: true,
  
  // Configuration pour éviter les erreurs de pretty-format
  snapshotSerializers: [],
  maxDepth: 5,
  
  // Variables globales
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};