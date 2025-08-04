// Utilitaire pour appeler l'API PHP
import { ENV_CONFIG, devLog } from './config/environment';

// Auto-détection de l'URL API (teste les ports disponibles)
let API_BASE = ENV_CONFIG.API_BASE_URL;
let apiBaseResolved = false;

// Fonction pour tester la connectivité API
async function testApiConnection(url) {
  try {
    const testUrl = new URL(url);
    testUrl.searchParams.append('path', 'test');
    
    const response = await fetch(testUrl, {
      method: 'GET',
      timeout: 3000,
      signal: AbortSignal.timeout(3000)
    });
    
    return response.status === 200 || response.status === 404; // 404 = API existe mais endpoint non trouvé
  } catch (error) {
    return false;
  }
}

// Auto-résolution de l'URL API (une seule fois)
async function resolveApiBase() {
  if (apiBaseResolved) return API_BASE;
  
  const primaryUrl = ENV_CONFIG.API_BASE_URL;
  const altUrl = ENV_CONFIG.API_BASE_URL_ALT;
  
  devLog('Résolution automatique de l\'URL API...');
  devLog('Test URL primaire:', primaryUrl);
  
  if (await testApiConnection(primaryUrl)) {
    devLog('✅ URL primaire fonctionne');
    API_BASE = primaryUrl;
  } else if (altUrl && await testApiConnection(altUrl)) {
    devLog('⚠️ URL primaire échoue, utilisation de l\'alternative:', altUrl);
    API_BASE = altUrl;
  } else {
    devLog('❌ Aucune URL API ne répond, utilisation de la primaire par défaut');
    API_BASE = primaryUrl;
  }
  
  apiBaseResolved = true;
  return API_BASE;
}

// Debug pour identifier le problème
console.log('DEBUG - Environment:', process.env.NODE_ENV);
console.log('DEBUG - ENV_CONFIG.API_BASE_URL:', ENV_CONFIG?.API_BASE_URL);
console.log('DEBUG - API_BASE final:', API_BASE);

export async function apiGet(path = '', params = {}) {
  const apiBase = await resolveApiBase();
  const url = new URL(apiBase);
  if (path) url.searchParams.append('path', path);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  
  devLog(`GET ${url.toString()}`);
  
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { 
    credentials: 'include',
    headers,
    signal: AbortSignal.timeout(ENV_CONFIG.API_TIMEOUT)
  });
  
  if (!response.ok) throw new Error('Erreur API : ' + response.status);
  const result = await response.json();
  
  devLog(`GET ${path} - Response:`, result);
  return result;
}

export async function apiPost(path = '', data = {}) {
  const apiBase = await resolveApiBase();
  const url = new URL(apiBase);
  if (path) url.searchParams.append('path', path);
  
  devLog(`POST ${url.toString()}`, data);
  
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'include',
    signal: AbortSignal.timeout(ENV_CONFIG.API_TIMEOUT)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    devLog(`POST ${path} - Error:`, errorText);
    
    try {
      const errorJson = JSON.parse(errorText);
      const errorMessage = errorJson.error || errorJson.message || 'Erreur API : ' + response.status;
      throw new Error(errorMessage);
    } catch (parseError) {
      // Si c'est notre propre erreur (pas une erreur de parsing), on la relance
      if (parseError.message.startsWith('Un agent') || parseError.message.startsWith('Erreur API')) {
        throw parseError;
      }
      throw new Error('Erreur API : ' + response.status);
    }
  }
  
  const result = await response.json();
  devLog(`POST ${path} - Response:`, result);
  return result;
}

export async function apiPut(path = '', data = {}, params = {}) {
  const apiBase = await resolveApiBase();
  const url = new URL(apiBase);
  if (path) url.searchParams.append('path', path);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  
  devLog(`PUT ${url.toString()}`, data);
  
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
    credentials: 'include',
    signal: AbortSignal.timeout(ENV_CONFIG.API_TIMEOUT)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    devLog(`PUT ${path} - Error:`, errorText);
    
    try {
      const errorJson = JSON.parse(errorText);
      const errorMessage = errorJson.error || errorJson.message || 'Erreur API : ' + response.status;
      throw new Error(errorMessage);
    } catch (parseError) {
      // Si c'est notre propre erreur (pas une erreur de parsing), on la relance
      if (parseError.message.startsWith('Un agent') || parseError.message.startsWith('Erreur API')) {
        throw parseError;
      }
      throw new Error('Erreur API : ' + response.status);
    }
  }
  
  const result = await response.json();
  devLog(`PUT ${path} - Response:`, result);
  return result;
}

export async function apiDelete(path = '', params = {}) {
  const apiBase = await resolveApiBase();
  const url = new URL(apiBase);
  if (path) url.searchParams.append('path', path);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  
  devLog(`DELETE ${url.toString()}`);
  
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers,
    credentials: 'include',
    signal: AbortSignal.timeout(ENV_CONFIG.API_TIMEOUT)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    devLog(`DELETE ${path} - Error:`, errorText);
    
    try {
      const errorJson = JSON.parse(errorText);
      const errorMessage = errorJson.error || errorJson.message || 'Erreur API : ' + response.status;
      throw new Error(errorMessage);
    } catch (parseError) {
      if (parseError.message.startsWith('Erreur API')) {
        throw parseError;
      }
      throw new Error('Erreur API : ' + response.status);
    }
  }
  
  const result = await response.json();
  devLog(`DELETE ${path} - Response:`, result);
  return result;
} 