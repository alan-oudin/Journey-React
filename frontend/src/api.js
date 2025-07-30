// Utilitaire pour appeler l'API PHP
import { ENV_CONFIG, devLog } from './config/environment';

const API_BASE = process.env.REACT_APP_API_URL || ENV_CONFIG.API_BASE_URL;

export async function apiGet(path = '', params = {}) {
  const url = new URL(API_BASE);
  if (path) url.searchParams.append('path', path);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  
  devLog(`GET ${url.toString()}`);
  
  const response = await fetch(url, { 
    credentials: 'include',
    signal: AbortSignal.timeout(ENV_CONFIG.API_TIMEOUT)
  });
  
  if (!response.ok) throw new Error('Erreur API : ' + response.status);
  const result = await response.json();
  
  devLog(`GET ${path} - Response:`, result);
  return result;
}

export async function apiPost(path = '', data = {}) {
  const url = new URL(API_BASE);
  if (path) url.searchParams.append('path', path);
  
  devLog(`POST ${url.toString()}`, data);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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