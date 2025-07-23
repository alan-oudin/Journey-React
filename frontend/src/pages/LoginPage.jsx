import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../api';

export default function LoginPage() {
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
        navigate('/gestion');
      } else {
        setError(res.message || 'Identifiants incorrects');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>🔒 Connexion</h2>
      <p>Veuillez vous connecter pour accéder à l'administration</p>

      {error && (
        <wcs-alert color="danger" show>
          {error}
          <wcs-button slot="action" shape="clear" onClick={() => setError('')}>Fermer</wcs-button>
        </wcs-alert>
      )}

      <form onSubmit={handleLogin}>
        <wcs-form-field label="Nom d'utilisateur">
          <wcs-input
            value={username}
            onInput={e => setUsername(e.target.value)}
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