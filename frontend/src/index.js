import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { defineCustomElements } from 'wcs-core/loader';
// Importer les polyfills pour la compatibilité navigateur
import './utils/polyfills';
// Améliorer la compatibilité des icônes
import './utils/iconFallback';

defineCustomElements(window);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service worker désactivé pour l'instant
serviceWorkerRegistration.unregister();
