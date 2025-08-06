import { apiGet, apiPost, apiPut, apiDelete } from './api';

// Mock fetch globalement
global.fetch = jest.fn();

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
  writable: true,
});

// Mock console.log to avoid debug output
global.console = {
  ...console,
  log: jest.fn(),
};

describe('API Functions', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.getItem.mockClear();
    console.error = jest.fn();
  });

  describe('apiGet', () => {
    test('should make GET request successfully', async () => {
      const mockData = { success: true, data: 'test' };
      
      // Mock both the API resolution fetch and the actual API call
      fetch
        .mockResolvedValueOnce({ status: 200, ok: true, text: async () => '', json: async () => ({}) }) // For API resolution
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData,
          text: async () => JSON.stringify(mockData)
        }); // For actual API call

      const result = await apiGet('test-endpoint');
      
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch.mock.calls[1][0]).toContain('path=test-endpoint');
      expect(fetch.mock.calls[1][1]).toMatchObject({
        credentials: 'include',
        headers: {}
      });
      expect(result).toEqual(mockData);
    });

    test('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiGet('test-endpoint')).rejects.toThrow('Network error');
    });

    test('should handle HTTP errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(apiGet('test-endpoint')).rejects.toThrow('Erreur API : 404');
    });
  });

  describe('apiPost', () => {
    test('should make POST request with data', async () => {
      const mockData = { success: true, id: 1 };
      const postData = { name: 'test' };
      
      // Mock only the actual API call (resolution is cached from previous test)
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
        text: async () => JSON.stringify(mockData)
      });

      const result = await apiPost('agents', postData);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][0]).toContain('path=agents');
      expect(fetch.mock.calls[0][1]).toMatchObject({
        method: 'POST',
        body: JSON.stringify(postData),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('apiDelete', () => {
    test('should make DELETE request with data', async () => {
      const mockData = { success: true };
      const deleteData = { code: '1234567A' };
      
      // Mock only the actual API call (resolution is cached from previous tests)
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
        text: async () => JSON.stringify(mockData)
      });

      const result = await apiDelete('agents', deleteData);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][0]).toContain('path=agents&code=1234567A');
      expect(fetch.mock.calls[0][1]).toMatchObject({
        method: 'DELETE',
        credentials: 'include',
        headers: {}
      });
      expect(result).toEqual(mockData);
    });
  });

  describe('Timeout handling', () => {
    test('should handle timeout', async () => {
      // Mock d'un délai qui dépasse le timeout
      fetch.mockImplementationOnce(() => 
        new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error('This operation was aborted'));
          }, 100);
        })
      );

      await expect(apiGet('slow-endpoint')).rejects.toThrow();
    }, 10000);
  });
});