// Utilitaire pour appeler l'API PHP
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/journeyV2/backend/public/api.php';

export async function apiGet(path = '', params = {}) {
  const url = new URL(API_BASE);
  if (path) url.searchParams.append('path', path);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error('Erreur API : ' + response.status);
  return response.json();
}

export async function apiPost(path = '', data = {}) {
  const url = new URL(API_BASE);
  if (path) url.searchParams.append('path', path);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
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
  return result;
} 