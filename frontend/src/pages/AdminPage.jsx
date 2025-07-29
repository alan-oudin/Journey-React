import React, { useState } from 'react';
import GestionPage from './GestionPage';
import AdminManagement from '../components/AdminManagement';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('gestion');


  return (
    <div>
      {/* Navigation avec boutons WCS */}
      <div style={{
        backgroundColor: 'var(--wcs-semantic-color-background-surface-body)',
        borderBottom: '1px solid var(--wcs-semantic-color-border-default)',
        padding: '16px 20px',
        display: 'flex',
        gap: '8px'
      }}>
        <wcs-button
          shape={activeTab === 'gestion' ? 'solid' : 'outline'}
          color="primary"
          onClick={() => setActiveTab('gestion')}
        >
          <wcs-mat-icon icon="assignment"></wcs-mat-icon>
          Gestion des inscriptions
        </wcs-button>
        <wcs-button
          shape={activeTab === 'admins' ? 'solid' : 'outline'}
          color="primary"
          onClick={() => setActiveTab('admins')}
        >
          <wcs-mat-icon icon="group"></wcs-mat-icon>
          Gestion des administrateurs
        </wcs-button>
      </div>

      {/* Contenu principal */}
      {activeTab === 'gestion' && <GestionPage />}
      {activeTab === 'admins' && <AdminManagement />}
    </div>
  );
}