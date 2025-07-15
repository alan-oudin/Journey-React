import React, { useState } from 'react';
import AlertMessage from '../components/AlertMessage';
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
        // Redirection après connexion
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
    <div className="login-view">
      <h2>🔒 Connexion</h2>
      <p className="subtitle">Veuillez vous connecter pour accéder à l'administration</p>

      {error && (
        <AlertMessage message={error} type="error" onClose={() => setError('')} />
      )}

      <div className="login-container">
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              type="text"
              id="username"
              placeholder="Entrez votre nom d'utilisateur"
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              id="password"
              placeholder="Entrez votre mot de passe"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>
          <button
            className="btn btn-primary login-btn"
            disabled={loading}
            type="submit"
          >
            {loading ? <span className="spinner-small"></span> : 'Se connecter'}
          </button>
        </form>
      </div>

      <div className="login-footer">
        <p>Accès réservé au personnel autorisé</p>
      </div>
    </div>
  );
} 