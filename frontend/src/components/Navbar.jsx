import React, { useState, useEffect } from 'react';
import {NavLink} from 'react-router-dom';

export default function Navbar() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

    useEffect(() => {
        // Fonction pour vérifier l'état d'authentification
        const checkAuthentication = () => {
            setIsAuthenticated(!!localStorage.getItem('token'));
        };

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
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authStateChanged', handleAuthStateChange);
        };
    }, []);

    return (
        <wcs-nav aria-label="Menu principal">
            <wcs-nav-item>
                <NavLink to="/">
                    <wcs-mat-icon icon="home"></wcs-mat-icon>
                    <span>Accueil</span>
                </NavLink>
            </wcs-nav-item>
            <wcs-nav-item>
                <NavLink
                    to="/recherche"
                    title={!isAuthenticated ? 'Connexion admin requise' : 'Recherche d\'agents'}
                >
                    <wcs-mat-icon icon="search"></wcs-mat-icon>
                    <span>Recherche</span>
                    {!isAuthenticated && <wcs-mat-icon icon="lock" style={{fontSize: '0.8em'}} title="Connexion requise"></wcs-mat-icon>}
                </NavLink>
            </wcs-nav-item>
            <wcs-nav-item>
                <NavLink
                    to="/admin"
                    title={!isAuthenticated ? 'Connexion admin requise' : 'Panneau d\'administration'}
                >
                    <wcs-mat-icon icon="admin_panel_settings"></wcs-mat-icon>
                    <span>Admin</span>
                    {!isAuthenticated && <wcs-mat-icon icon="lock" style={{fontSize: '0.8em'}} title="Connexion requise"></wcs-mat-icon>}
                </NavLink>
            </wcs-nav-item>
        </wcs-nav>
    );
} 