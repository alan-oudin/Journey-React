// Import des polyfills pour les tester
import './polyfills';

describe('Polyfills', () => {
  describe('AbortController polyfill', () => {
    test('should provide AbortController when not available', () => {
      expect(global.AbortController).toBeDefined();
      expect(typeof global.AbortController).toBe('function');
    });

    test('should create AbortController with signal', () => {
      const controller = new AbortController();
      expect(controller.signal).toBeDefined();
      expect(typeof controller.abort).toBe('function');
    });

    test('should abort signal when abort is called', () => {
      const controller = new AbortController();
      expect(controller.signal.aborted).toBe(false);
      
      controller.abort();
      expect(controller.signal.aborted).toBe(true);
    });
  });

  describe('String.prototype.at polyfill', () => {
    test('should work with positive indices', () => {
      const str = 'hello';
      expect(str.at(0)).toBe('h');
      expect(str.at(1)).toBe('e');
      expect(str.at(4)).toBe('o');
    });

    test('should work with negative indices', () => {
      const str = 'hello';
      expect(str.at(-1)).toBe('o');
      expect(str.at(-2)).toBe('l');
      expect(str.at(-5)).toBe('h');
    });

    test('should return undefined for out of bounds', () => {
      const str = 'hello';
      expect(str.at(10)).toBeUndefined();
      expect(str.at(-10)).toBeUndefined();
    });
  });

  describe('Array.prototype.at polyfill', () => {
    test('should work with positive indices', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr.at(0)).toBe(1);
      expect(arr.at(2)).toBe(3);
      expect(arr.at(4)).toBe(5);
    });

    test('should work with negative indices', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr.at(-1)).toBe(5);
      expect(arr.at(-2)).toBe(4);
      expect(arr.at(-5)).toBe(1);
    });

    test('should return undefined for out of bounds', () => {
      const arr = [1, 2, 3];
      expect(arr.at(10)).toBeUndefined();
      expect(arr.at(-10)).toBeUndefined();
    });
  });

  describe('Object.hasOwn polyfill', () => {
    test('should work like Object.prototype.hasOwnProperty', () => {
      const obj = { foo: 'bar', baz: 42 };
      
      expect(Object.hasOwn(obj, 'foo')).toBe(true);
      expect(Object.hasOwn(obj, 'baz')).toBe(true);
      expect(Object.hasOwn(obj, 'nonexistent')).toBe(false);
    });

    test('should work with inherited properties', () => {
      const parent = { inherited: 'value' };
      const child = Object.create(parent);
      child.own = 'property';
      
      expect(Object.hasOwn(child, 'own')).toBe(true);
      expect(Object.hasOwn(child, 'inherited')).toBe(false);
    });

    test('should work with null prototype objects', () => {
      const obj = Object.create(null);
      obj.prop = 'value';
      
      expect(Object.hasOwn(obj, 'prop')).toBe(true);
      expect(Object.hasOwn(obj, 'toString')).toBe(false);
    });
  });
});