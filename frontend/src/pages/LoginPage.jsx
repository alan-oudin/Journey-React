import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../api';
import { useAlertDrawer } from '../contexts/AlertContext.tsx';

export default function LoginPage() {
  const { showAlert } = useAlertDrawer();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiPost('login', { username, password });
      if (res.success && res.token) {
        localStorage.setItem('token', res.token);
        // Déclencher un événement personnalisé pour notifier les autres composants
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        navigate('/admin');
      } else {
        showAlert({
          title: 'Erreur de connexion',
          subtitle: res.message || 'Identifiants incorrects',
          intent: 'error',
          showProgressBar: true,
          timeout: 5000
        });
      }
    } catch (e) {
      showAlert({
        title: 'Erreur de connexion',
        subtitle: e.message,
        intent: 'error',
        showProgressBar: true,
        timeout: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin(e);
    }
  };

  return (
    <div>
      <h2>🔒 Connexion</h2>
      <p>Veuillez vous connecter pour accéder à l'administration</p>


      <form onSubmit={handleLogin}>
        <wcs-form-field label="Nom d'utilisateur">
          <wcs-input
            value={username}
            onInput={e => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            name="username"
            placeholder="Entrez votre nom d'utilisateur"
            autoComplete="username"
            required
            disabled={loading}
          ></wcs-input>
        </wcs-form-field>
        <wcs-form-field label="Mot de passe">
          <wcs-input
            value={password}
            onInput={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            type="password"
            name="password"
            placeholder="Entrez votre mot de passe"
            autoComplete="current-password"
            required
            disabled={loading}
          ></wcs-input>
        </wcs-form-field>
        <wcs-button color="primary" type="submit" shape="block" disabled={loading} style={{marginTop: 16}}>
          {loading ? <wcs-spinner size="small"></wcs-spinner> : 'Se connecter'}
        </wcs-button>
      </form>
      <div style={{marginTop: 16}}>
        <p>Accès réservé au personnel autorisé</p>
      </div>
    </div>
  );
} 