import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  return (
    <nav className="app-navbar">
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Accueil</Link>
      <Link to="/gestion" className={location.pathname === '/gestion' ? 'active' : ''}>Gestion</Link>
      <Link to="/recherche" className={location.pathname === '/recherche' ? 'active' : ''}>Recherche</Link>
      <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>Connexion</Link>
    </nav>
  );
} 