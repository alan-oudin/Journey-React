import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet } from '../api';

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthentication();
    
    // Écouter les changements du localStorage (connexion/déconnexion)
    const handleStorageChange = () => {
      checkAuthentication();
    };
    
    // Écouter l'événement personnalisé pour les changements d'authentification
    const handleAuthStateChange = () => {
      checkAuthentication();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthStateChange);
    
    // Vérifier périodiquement l'état d'authentification
    const interval = setInterval(checkAuthentication, 30000); // Toutes les 30 secondes
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthStateChange);
      clearInterval(interval);
    };
  }, []);

  const checkAuthentication = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    try {
      const data = await apiGet('verify-token');
      
      if (data.valid) {
        setIsAuthenticated(true);
        setUser({
          username: data.username,
          role: data.role
        });
      } else {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Erreur de vérification:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    // Déclencher un événement personnalisé pour notifier les autres composants
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    navigate('/');
  };

  return (
    <wcs-header>
      <img slot="logo" alt="SNCF" src="./logo/Logo SNCF Voyageurs.png" />
      <h1 slot="title">Journée des Proches SNCF</h1>
      <div slot="actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated ? (
          <>
            <span style={{ 
              fontSize: '0.9em', 
              color: '#6c757d',
              padding: '4px 8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #dee2e6'
            }}>
              👤 {user?.username} ({user?.role})
            </span>
            <wcs-button color="secondary" size="s" onClick={handleLogout}>
              <wcs-icon name="exit_to_app" />
              Déconnexion
            </wcs-button>
          </>
        ) : (
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <wcs-button color="primary">
              <wcs-icon name="user" />
              Connexion
            </wcs-button>
          </Link>
        )}
      </div>
    </wcs-header>
  );
} 