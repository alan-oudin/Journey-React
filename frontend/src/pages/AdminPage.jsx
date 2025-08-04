import React, { useState } from 'react';
import GestionPage from './GestionPage';
import AdminManagement from '../components/AdminManagement';
import UserEditor from '../components/UserEditor';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('gestion');


  return (
    <div>
      {/* Navigation avec boutons WCS */}
      <div className="admin-nav-secondary">
        <wcs-button
          shape={activeTab === 'gestion' ? 'solid' : 'outline'}
          color="primary"
          onClick={() => setActiveTab('gestion')}
        >
          <wcs-mat-icon icon="assignment"></wcs-mat-icon>
          Gestion des inscriptions
        </wcs-button>

        <wcs-button
          shape={activeTab === 'users' ? 'solid' : 'outline'}
          color="primary"
          onClick={() => setActiveTab('users')}
        >
          <wcs-mat-icon icon="edit"></wcs-mat-icon>
          Modification des utilisateurs
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
      {activeTab === 'users' && <UserEditor />}
    </div>
  );
}