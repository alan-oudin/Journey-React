import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  return (
    <wcs-nav aria-label="Menu principal">
      <wcs-nav-item id="home">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Accueil
        </Link>
      </wcs-nav-item>
      <wcs-nav-item id="gestion">
        <Link to="/gestion" className={location.pathname === '/gestion' ? 'active' : ''}>
          Gestion
        </Link>
      </wcs-nav-item>
      <wcs-nav-item id="recherche">
        <Link to="/recherche" className={location.pathname === '/recherche' ? 'active' : ''}>
          Recherche
        </Link>
      </wcs-nav-item>
    </wcs-nav>
  );
} 