import React, { useState, useEffect, useCallback } from 'react';

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', role: 'admin' });
  const [alerts, setAlerts] = useState([]);

  const showAlert = useCallback((message, type = 'info') => {
    const id = Date.now();
    const alert = { id, message, type };
    setAlerts(prev => [...prev, alert]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  }, []);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/journeyV2/backend/public/api.php?path=admins', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setAdmins(data);
      }
    } catch (error) {
      showAlert('Erreur lors du chargement des administrateurs', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.username || !newAdmin.password) {
      showAlert('Veuillez remplir tous les champs', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/journeyV2/backend/public/api.php?path=admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAdmin)
      });
      
      const data = await response.json();
      if (data.success) {
        showAlert('Administrateur ajouté avec succès', 'success');
        setNewAdmin({ username: '', password: '', role: 'admin' });
        setShowAddForm(false);
        fetchAdmins();
      } else {
        showAlert(data.error || 'Erreur lors de l\'ajout', 'error');
      }
    } catch (error) {
      showAlert('Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId, username) => {
    if (!window.confirm(`Supprimer l'administrateur "${username}" ?`)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/journeyV2/backend/public/api.php?path=admins&id=${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        showAlert('Administrateur supprimé avec succès', 'success');
        fetchAdmins();
      } else {
        showAlert(data.error || 'Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      showAlert('Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>👥 Gestion des administrateurs</h3>
        <wcs-button 
          color="primary" 
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={loading}
        >
          {showAddForm ? 'Annuler' : '➕ Ajouter un administrateur'}
        </wcs-button>
      </div>

      {/* Alertes */}
      {alerts.map(alert => (
        <wcs-alert 
          key={alert.id}
          intent={alert.type === 'success' ? 'success' : 'error'}
          show
          style={{ marginBottom: '16px' }}
        >
          <span slot="title">{alert.message}</span>
          <wcs-button 
            slot="action" 
            shape="clear" 
            onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
          >
            Fermer
          </wcs-button>
        </wcs-alert>
      ))}

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <wcs-card style={{ marginBottom: '24px', padding: '20px' }}>
          <h4>Ajouter un nouvel administrateur</h4>
          <form onSubmit={handleAddAdmin}>
            <wcs-form-field label="Nom d'utilisateur" style={{ marginBottom: '16px' }}>
              <wcs-input
                value={newAdmin.username}
                onInput={(e) => setNewAdmin(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Nom d'utilisateur"
                required
                disabled={loading}
              />
            </wcs-form-field>
            
            <wcs-form-field label="Mot de passe" style={{ marginBottom: '16px' }}>
              <wcs-input
                type="password"
                value={newAdmin.password}
                onInput={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Mot de passe"
                required
                disabled={loading}
              />
            </wcs-form-field>
            
            <wcs-form-field label="Rôle" style={{ marginBottom: '16px' }}>
              <wcs-select 
                value={newAdmin.role}
                onWcsChange={(e) => setNewAdmin(prev => ({ ...prev, role: e.detail.value }))}
                disabled={loading}
              >
                <wcs-select-option value="admin">Administrateur</wcs-select-option>
                <wcs-select-option value="super-admin">Super Administrateur</wcs-select-option>
              </wcs-select>
            </wcs-form-field>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <wcs-button type="submit" color="primary" disabled={loading}>
                {loading ? <wcs-spinner size="small" /> : 'Ajouter'}
              </wcs-button>
              <wcs-button 
                type="button" 
                color="secondary" 
                onClick={() => setShowAddForm(false)}
                disabled={loading}
              >
                Annuler
              </wcs-button>
            </div>
          </form>
        </wcs-card>
      )}

      {/* Liste des administrateurs */}
      <wcs-card>
        <div style={{ padding: '20px' }}>
          <h4>Liste des administrateurs</h4>
          {loading && <wcs-spinner style={{ display: 'block', margin: '16px auto' }} />}
          
          {!loading && admins.length === 0 && (
            <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
              Aucun administrateur trouvé
            </p>
          )}
          
          {!loading && admins.length > 0 && (
            <div style={{ display: 'grid', gap: '12px' }}>
              {admins.map(admin => (
                <div 
                  key={admin.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{admin.username}</div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>
                      Rôle: {admin.role} • Créé le: {new Date(admin.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <wcs-button 
                    color="danger" 
                    size="s"
                    onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                    disabled={loading || admin.id === 1} // Protéger l'admin par défaut
                  >
                    🗑️ Supprimer
                  </wcs-button>
                </div>
              ))}
            </div>
          )}
        </div>
      </wcs-card>
    </div>
  );
}