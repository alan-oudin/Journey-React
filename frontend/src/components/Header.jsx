import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <wcs-header>
      <img slot="logo" alt="SNCF" src="/logo/Logo SNCF Voyageurs.png" />
      <h1 slot="title">Journée des Proches SNCF</h1>
      <div slot="actions">
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <wcs-button>
            <wcs-icon name="user" />
            Connexion
          </wcs-button>
        </Link>
      </div>
    </wcs-header>
  );
} 