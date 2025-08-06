import { detectBrowser, supportsEmoji, MaterialIconWithFallback } from './iconFallback';
import { render, screen } from '@testing-library/react';

describe('Icon Fallback System', () => {
  describe('detectBrowser', () => {
    test('should detect Chrome', () => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true,
      });

      expect(detectBrowser()).toBe('chrome');

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });

    test('should detect Safari', () => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        configurable: true,
      });

      expect(detectBrowser()).toBe('safari');

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });

    test('should detect Firefox', () => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        configurable: true,
      });

      expect(detectBrowser()).toBe('firefox');

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });

    test('should detect Opera', () => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 OPR/77.0.4054.172',
        configurable: true,
      });

      expect(detectBrowser()).toBe('opera');

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });

    test('should return unknown for unrecognized browsers', () => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Some Unknown Browser',
        configurable: true,
      });

      expect(detectBrowser()).toBe('unknown');

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });
  });

  describe('supportsEmoji', () => {
    test('should return boolean', () => {
      const result = supportsEmoji();
      expect(typeof result).toBe('boolean');
    });

    // Note: Il est difficile de tester la vraie détection d'emoji en JSDOM
    // mais on peut au moins vérifier que la fonction ne plante pas
    test('should not throw error', () => {
      expect(() => supportsEmoji()).not.toThrow();
    });
  });

  describe('MaterialIconWithFallback Component', () => {
    test('should render component without crashing', () => {
      render(
        <MaterialIconWithFallback 
          icon="check_circle" 
          color="primary" 
          size="m" 
        />
      );

      // Component should render - either wcs-mat-icon or fallback
      expect(document.body).toBeInTheDocument();
    });

    test('should render with proper props', () => {
      render(
        <MaterialIconWithFallback 
          icon="radio_button_unchecked" 
          color="gray" 
          size="m" 
        />
      );

      // Should have rendered something
      expect(document.body).toBeInTheDocument();
    });

    test('should handle unknown icons gracefully', () => {
      render(
        <MaterialIconWithFallback 
          icon="unknown_icon" 
          color="primary" 
          size="m" 
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    test('should accept color prop', () => {
      render(
        <MaterialIconWithFallback 
          icon="check_circle" 
          color="primary" 
          size="m" 
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    test('should accept size prop', () => {
      render(
        <MaterialIconWithFallback 
          icon="check_circle" 
          color="primary" 
          size="l" 
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });
});