// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Configuration globale pour les timeouts de @testing-library
import { configure } from '@testing-library/react';

configure({ 
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 15000  // 15 secondes au lieu de 5
});

// Configuration globale pour les tests - Mock fetch pour les tests
global.fetch = jest.fn();

// Mock pour AbortController si nécessaire
if (!global.AbortController) {
  global.AbortController = class {
    constructor() {
      this.signal = { aborted: false };
      this.abort = () => {
        this.signal.aborted = true;
      };
    }
  };
}

// Mock pour les custom elements WCS
const mockCustomElement = (tagName) => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
      }
      
      connectedCallback() {
        this.shadowRoot.innerHTML = `<slot></slot>`;
      }
    });
  }
};

// Mock des composants WCS utilisés
const wcsComponents = [
  'wcs-button',
  'wcs-input',
  'wcs-select',
  'wcs-select-option',
  'wcs-checkbox',
  'wcs-form-field',
  'wcs-label',
  'wcs-hint',
  'wcs-card',
  'wcs-badge',
  'wcs-spinner',
  'wcs-nav',
  'wcs-nav-item',
  'wcs-header',
  'wcs-modal',
  'wcs-button-group'
];

wcsComponents.forEach(mockCustomElement);

// Mock pour localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock pour window.location
delete window.location;
window.location = { 
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  reload: jest.fn()
};

// Mock pour HTMLCanvasElement pour les tests d'emoji
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 10 })),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray([255, 255, 255, 255]) // Mock data qui simule un pixel non-transparent
  }))
}));