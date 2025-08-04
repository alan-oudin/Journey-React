import React, { useState, useEffect } from 'react';
import {NavLink} from 'react-router-dom';
import { MaterialIconWithFallback } from '../utils/iconFallback';

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
                    <MaterialIconWithFallback icon="home" />
                    <span>Accueil</span>
                </NavLink>
            </wcs-nav-item>
            <wcs-nav-item>
                <NavLink
                    to="/recherche"
                    title={!isAuthenticated ? 'Connexion admin requise' : 'Recherche d\'agents'}
                >
                    <MaterialIconWithFallback icon="search" />
                    <span>Recherche</span>
                    {!isAuthenticated && <MaterialIconWithFallback icon="lock" size="s" title="Connexion requise" />}
                </NavLink>
            </wcs-nav-item>
            <wcs-nav-item>
                <NavLink
                    to="/admin"
                    title={!isAuthenticated ? 'Connexion admin requise' : 'Panneau d\'administration'}
                >
                    <MaterialIconWithFallback icon="admin_panel_settings" />
                    <span>Admin</span>
                    {!isAuthenticated && <MaterialIconWithFallback icon="lock" size="s" title="Connexion requise" />}
                </NavLink>
            </wcs-nav-item>
        </wcs-nav>
    );
} 