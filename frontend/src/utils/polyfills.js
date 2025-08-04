// Polyfills pour améliorer la compatibilité navigateur
// Notamment pour Safari ancien et Opera

// Polyfill pour AbortController si non disponible (Safari < 12.1)
if (!window.AbortController) {
  window.AbortController = class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {}
      };
    }
    
    abort() {
      this.signal.aborted = true;
    }
  };
}

// Polyfill pour String.prototype.at() (Safari < 15.4)
if (!String.prototype.at) {
  String.prototype.at = function(index) {
    if (index < 0) {
      index = this.length + index;
    }
    return this[index];
  };
}

// Polyfill pour Array.prototype.at() (Safari < 15.4)
if (!Array.prototype.at) {
  Array.prototype.at = function(index) {
    if (index < 0) {
      index = this.length + index;
    }
    return this[index];
  };
}

// Polyfill pour Object.hasOwn() (Safari < 15.4)
if (!Object.hasOwn) {
  Object.hasOwn = function(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
}

// Améliorer la compatibilité de fetch pour les anciennes versions
if (window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    // Gérer le timeout manuellement si AbortSignal.timeout n'existe pas
    if (options.timeout && !options.signal) {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), options.timeout);
      options.signal = controller.signal;
      delete options.timeout;
    }
    
    return originalFetch(url, options);
  };
}

// Console polyfill pour très vieux navigateurs
if (!window.console) {
  window.console = {
    log: () => {},
    error: () => {},
    warn: () => {},
    info: () => {}
  };
}

export default {};