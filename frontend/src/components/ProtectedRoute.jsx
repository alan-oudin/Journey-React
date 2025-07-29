import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/journeyV2/backend/public/api.php?path=verify-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.valid) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Erreur de vérification:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <wcs-spinner size="large"></wcs-spinner>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h2>🔒 Accès restreint</h2>
          <p>Cette page est réservée aux administrateurs.</p>
          <p>Veuillez vous connecter pour accéder à cette section.</p>
        </div>

        <wcs-alert intent="warning" show="" timeout="5000"  style={{ marginBottom: '24px' }}>
          <span slot="title">Authentification requise</span>
          <span slot="subtitle">Vous devez être connecté en tant qu'administrateur pour accéder à cette section.</span>
        </wcs-alert>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <wcs-button 
            color="primary" 
            onClick={() => navigate('/login')}
          >
            🔐 Se connecter
          </wcs-button>
          <wcs-button 
            color="secondary" 
            onClick={() => navigate('/')}
          >
            🏠 Retour à l'accueil
          </wcs-button>
        </div>
      </div>
    );
  }

  return children;
}