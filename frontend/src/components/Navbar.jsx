import React from 'react';
import {NavLink, useLocation} from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();
    const isAuthenticated = !!localStorage.getItem('token');

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
                    {!isAuthenticated && <wcs-mat-icon icon="lock" style={{fontSize: '0.8em', marginLeft: '6px'}} title="Connexion requise"></wcs-mat-icon>}
                </NavLink>
            </wcs-nav-item>
            <wcs-nav-item>
                <NavLink
                    to="/admin"
                    title={!isAuthenticated ? 'Connexion admin requise' : 'Panneau d\'administration'}
                >
                    <wcs-mat-icon icon="admin_panel_settings"></wcs-mat-icon>
                    <span>Admin</span>
                    {!isAuthenticated && <wcs-mat-icon icon="lock" style={{fontSize: '0.8em', marginLeft: '6px'}} title="Connexion requise"></wcs-mat-icon>}
                </NavLink>
            </wcs-nav-item>
        </wcs-nav>
    );
} 