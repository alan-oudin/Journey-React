// API Test Script
// This script tests connectivity to all API endpoints used in the application
// Run with Node.js: node api-test.js

// Node.js v18+ has native fetch support, no need for node-fetch
const ENV_CONFIG = {
  development: {
    API_BASE_URL: 'http://localhost:8080/journey/backend/public/api.php',
  },
  production: {
    API_BASE_URL: 'https://tmtercvdl.sncf.fr/journey/backend/public/api.php',
  }
};

// Use development environment for testing
const API_BASE = ENV_CONFIG.development.API_BASE_URL;

// Helper function for GET requests
async function apiGet(path = '', params = {}) {
  const url = new URL(API_BASE);
  if (path) url.searchParams.append('path', path);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  
  console.log(`Testing GET ${url.toString()}`);
  
  const headers = {};
  // Add token if available
  const token = process.env.TEST_TOKEN;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, { 
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper function for POST requests
async function apiPost(path = '', data = {}) {
  const url = new URL(API_BASE);
  if (path) url.searchParams.append('path', path);
  
  console.log(`Testing POST ${url.toString()}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || errorJson.message || `Error ${response.status}`);
      } catch (parseError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }
    
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test all endpoints
async function testAllEndpoints() {
  console.log('=== API Connectivity Test ===');
  console.log(`Testing against: ${API_BASE}`);
  console.log('---------------------------');
  
  // Test endpoints that don't require authentication
  const publicEndpoints = [
    { method: 'GET', path: 'creneaux', params: {} },
    // Add more public endpoints here
  ];
  
  console.log('\n=== Testing Public Endpoints ===');
  for (const endpoint of publicEndpoints) {
    if (endpoint.method === 'GET') {
      const result = await apiGet(endpoint.path, endpoint.params);
      console.log(`${endpoint.path}: ${result.success ? 'SUCCESS' : 'FAILED - ' + result.error}`);
    } else if (endpoint.method === 'POST') {
      const result = await apiPost(endpoint.path, endpoint.data);
      console.log(`${endpoint.path}: ${result.success ? 'SUCCESS' : 'FAILED - ' + result.error}`);
    }
  }
  
  // Test endpoints that require authentication
  // Note: These will fail without a valid token
  const authEndpoints = [
    { method: 'GET', path: 'admins', params: {} },
    { method: 'GET', path: 'agents', params: {} },
    { method: 'GET', path: 'stats', params: {} },
    { method: 'GET', path: 'verify-token', params: {} },
    // Add more authenticated endpoints here
  ];
  
  console.log('\n=== Testing Authenticated Endpoints ===');
  console.log('Note: These tests will fail without a valid token set in TEST_TOKEN environment variable');
  for (const endpoint of authEndpoints) {
    if (endpoint.method === 'GET') {
      const result = await apiGet(endpoint.path, endpoint.params);
      console.log(`${endpoint.path}: ${result.success ? 'SUCCESS' : 'FAILED - ' + result.error}`);
    } else if (endpoint.method === 'POST') {
      const result = await apiPost(endpoint.path, endpoint.data);
      console.log(`${endpoint.path}: ${result.success ? 'SUCCESS' : 'FAILED - ' + result.error}`);
    }
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the tests
testAllEndpoints().catch(error => {
  console.error('Test failed with error:', error);
});