import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet } from '../api';

// Composant réutilisable pour les boutons d'authentification
function AuthButton({ variant, onClick, to, desktopText, mobileText, ariaLabel }) {
  const content = to ? 
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
      {desktopText}
    </Link> : desktopText;

  const mobileContent = to ? 
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
      {mobileText}
    </Link> : mobileText;

  return (
    <>
      <wcs-button 
        color={variant} 
        size="s" 
        onClick={onClick}
        className="auth-button-desktop"
        aria-label={`${ariaLabel} - Version bureau`}
      >
        {content}
      </wcs-button>
      <wcs-button 
        color={variant} 
        size="s" 
        onClick={onClick}
        className="auth-button-mobile"
        aria-label={`${ariaLabel} - Version mobile`}
      >
        {mobileContent}
      </wcs-button>
    </>
  );
}

// Hook personnalisé pour l'authentification
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuthentication = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    window.dispatchEvent(new CustomEvent('authStateChanged'));

    // Rediriger vers la page d'accueil et rafraîchir
    navigate('/');
    setTimeout(() => {
      window.location.reload();
    }, 100); // Petit délai pour s'assurer que la navigation s'est bien faite
  }, [navigate]);

  return { isAuthenticated, user, isLoading, checkAuthentication, handleLogout };
}

export default function Header() {
  const { isAuthenticated, user, isLoading, checkAuthentication, handleLogout } = useAuth();

  useEffect(() => {
    checkAuthentication();
    
    const handleStorageChange = () => checkAuthentication();
    const handleAuthStateChange = () => checkAuthentication();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthStateChange);
    
    // Vérification périodique optimisée (toutes les 5 minutes au lieu de 30 secondes)
    const interval = setInterval(checkAuthentication, 300000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthStateChange);
      clearInterval(interval);
    };
  }, [checkAuthentication]);

  return (
    <wcs-header>
      {/* Logo slot */}
      <img 
        slot="logo"
        alt="Logo SNCF Voyageurs - Journée des Proches" 
        src="/journey/logo/Logo SNCF Voyageurs.png"
      />
      
      {/* Title slot */}
      <h1 slot="title">
        Journée des Proches SNCF
      </h1>

      {/* Actions slot : Info utilisateur + Boutons - collé à droite */}
      <div slot="actions" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        marginLeft: 'auto'
      }}>
        {/* Info utilisateur */}
        {isAuthenticated && (
          <div className="user-info" role="banner" aria-label="Informations utilisateur">
            <span aria-hidden="true">👤</span>
            <span className="sr-only">Utilisateur connecté :</span>
            <span>{user?.username}</span>

          </div>
        )}
        
        {/* Boutons d'authentification */}
        <div className="auth-buttons">
          {isLoading ? (
            <wcs-spinner size="small" aria-label="Vérification de l'authentification..."></wcs-spinner>
          ) : isAuthenticated ? (
            <AuthButton
              variant="secondary"
              onClick={handleLogout}
              desktopText="🚪 Déconnexion"
              mobileText="🚪"
              ariaLabel="Se déconnecter"
            />
          ) : (
            <AuthButton
              variant="primary"
              to="/login"
              desktopText="🔑 Connexion"
              mobileText="🔑"
              ariaLabel="Se connecter"
            />
          )}
        </div>
      </div>
    </wcs-header>
  );
} 