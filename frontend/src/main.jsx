import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { defineCustomElements } from 'wcs-core/loader';

defineCustomElements(window);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 