import React, { useState, useEffect, useRef, useCallback } from 'react';

const STATUTS = [
  { value: 'inscrit', label: 'Inscrit' },
  { value: 'present', label: 'Présent' },
  { value: 'absent', label: 'Absent' },
  { value: 'annule', label: 'Annulé' }
];

const creneauxMatin = [
  '09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00', '11:20', '11:40'
];
const creneauxApresMidi = [
  '13:00', '13:20', '13:40', '14:00', '14:20', '14:40', '15:00', '15:20', '15:40'
];

// const allCreneaux = [...creneauxMatin, ...creneauxApresMidi]; // Non utilisé actuellement

export default function UserEditor() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: '',
    prenom: '',
    nombre_proches: 0,
    heure_arrivee: '',
    statut: 'inscrit',
    restauration_sur_place: false,
    note: ''
  });
  const [alerts, setAlerts] = useState([]);
  const [creneaux, setCreneaux] = useState({ matin: {}, 'apres-midi': {} });
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);
  const [showCreneauxSelector, setShowCreneauxSelector] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const statutSelectRef = useRef(null);
  const checkboxRestaurationRef = useRef(null);

  const showAlert = useCallback((message, type = 'info') => {
    const id = Date.now();
    const alert = { id, message, type };
    setAlerts(prev => [...prev, alert]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/journeyV2/backend/public/api.php?path=agents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setAgents(data);
      }
    } catch (error) {
      showAlert('Erreur lors du chargement des agents', 'error');
    }
  }, [showAlert]);

  const fetchCreneaux = useCallback(async () => {
    setLoadingCreneaux(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/journeyV2/backend/public/api.php?path=creneaux', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setCreneaux(data);
    } catch (error) {
      showAlert('Erreur lors du chargement des créneaux', 'error');
      setCreneaux({ matin: {}, 'apres-midi': {} });
    } finally {
      setLoadingCreneaux(false);
    }
  }, [showAlert]);

  const fetchHistory = async (codePersonnel) => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/journeyV2/backend/public/api.php?path=history&code=${codePersonnel}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.history);
      } else {
        showAlert('Erreur lors du chargement de l\'historique', 'error');
        setHistory([]);
      }
    } catch (error) {
      showAlert('Erreur de connexion au serveur', 'error');
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getFieldDisplayName = (fieldName) => {
    const fieldNames = {
      'nom': 'Nom',
      'prenom': 'Prénom',
      'nombre_proches': 'Nombre de proches',
      'heure_arrivee': 'Heure d\'arrivée',
      'statut': 'Statut',
      'restauration_sur_place': 'Restauration sur place',
      'note': 'Note'
    };
    return fieldNames[fieldName] || fieldName;
  };

  const formatHistoryValue = (fieldName, value) => {
    if (value === null || value === '') return 'Vide';
    
    switch (fieldName) {
      case 'statut':
        return STATUTS.find(s => s.value === value)?.label || value;
      case 'restauration_sur_place':
        return value === '1' || value === 1 || value === true ? 'Oui' : 'Non';
      default:
        return value;
    }
  };

  // Fonction pour calculer la disponibilité avec simulation du changement
  const getCreneauDisponibilite = (heure, nombreProches = 0) => {
    const periode = heure < '12:00' ? 'matin' : 'apres-midi';
    const info = creneaux[periode]?.[heure] || { agents_inscrits: 0, personnes_total: 0, places_restantes: 14, complet: false };
    
    // Si c'est le créneau actuel de l'agent, on ne compte pas ses places
    let ajustement = 0;
    if (selectedAgent && selectedAgent.heure_arrivee === heure && ['inscrit', 'present'].includes(selectedAgent.statut)) {
      ajustement = -(parseInt(selectedAgent.nombre_proches) + 1);
    }
    
    // Simuler l'ajout du nouvel agent avec ses proches
    const nouvellePersonnesTotal = info.personnes_total + ajustement + nombreProches + 1;
    const nouvellesPlacesRestantes = Math.max(0, 14 - nouvellePersonnesTotal);
    const nouveauComplet = nouvellePersonnesTotal >= 14;
    
    return {
      ...info,
      personnes_total_simule: nouvellePersonnesTotal,
      places_restantes_simule: nouvellesPlacesRestantes,
      complet_simule: nouveauComplet,
      changement: ajustement !== 0
    };
  };

  const searchAgent = async () => {
    if (!searchCode.trim()) {
      showAlert('Veuillez entrer un code personnel', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/journeyV2/backend/public/api.php?path=search&q=${searchCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (response.status === 404) {
        showAlert('Agent non trouvé', 'error');
        setSelectedAgent(null);
      } else if (data.error) {
        showAlert(data.error, 'error');
        setSelectedAgent(null);
      } else {
        setSelectedAgent(data);
        setEditForm({
          nom: data.nom || '',
          prenom: data.prenom || '',
          nombre_proches: data.nombre_proches || 0,
          heure_arrivee: data.heure_arrivee || '',
          statut: data.statut || 'inscrit',
          restauration_sur_place: data.restauration_sur_place === 1 || data.restauration_sur_place === '1' || data.restauration_sur_place === true,
          note: data.note || ''
        });
        setEditMode(false);
      }
    } catch (error) {
      showAlert('Erreur de connexion au serveur', 'error');
      setSelectedAgent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/journeyV2/backend/public/api.php?path=agents&code=${selectedAgent.code_personnel}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editForm,
          restauration_sur_place: editForm.restauration_sur_place ? 1 : 0,
          nombre_proches: parseInt(editForm.nombre_proches)
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showAlert('Informations mises à jour avec succès', 'success');
        setSelectedAgent(data.agent);
        setEditMode(false);
        fetchAgents(); // Rafraîchir la liste
      } else {
        showAlert(data.error || 'Erreur lors de la mise à jour', 'error');
      }
    } catch (error) {
      showAlert('Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchCreneaux();
  }, [fetchAgents, fetchCreneaux]);

  // Rafraîchir les créneaux quand on entre en mode édition
  useEffect(() => {
    if (editMode && selectedAgent) {
      fetchCreneaux();
    }
  }, [editMode, selectedAgent, fetchCreneaux]);

  // Gérer les événements du select de statut
  useEffect(() => {
    const selectElement = statutSelectRef.current;
    if (selectElement && editMode) {
      const handleWcsChangeEvent = (event) => {
        setEditForm(prev => ({ ...prev, statut: event.detail.value }));
      };
      
      selectElement.addEventListener('wcsChange', handleWcsChangeEvent);
      
      return () => {
        selectElement.removeEventListener('wcsChange', handleWcsChangeEvent);
      };
    }
  }, [editMode, selectedAgent]);

  // Gérer les événements de la checkbox de restauration
  useEffect(() => {
    const checkboxElement = checkboxRestaurationRef.current;
    if (checkboxElement && editMode) {
      const handleWcsChangeEvent = (event) => {
        setEditForm(prev => ({ ...prev, restauration_sur_place: event.detail.checked }));
      };
      
      checkboxElement.addEventListener('wcsChange', handleWcsChangeEvent);
      
      return () => {
        checkboxElement.removeEventListener('wcsChange', handleWcsChangeEvent);
      };
    }
  }, [editMode, selectedAgent]);

  // Synchroniser la checkbox WCS avec l'état React
  useEffect(() => {
    const checkboxElement = checkboxRestaurationRef.current;
    if (checkboxElement) {
      checkboxElement.checked = editMode ? editForm.restauration_sur_place : (selectedAgent?.restauration_sur_place === 1 || selectedAgent?.restauration_sur_place === '1' || selectedAgent?.restauration_sur_place === true);
    }
  }, [editMode, editForm.restauration_sur_place, selectedAgent]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>✏️ Modification des informations utilisateur</h3>
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

      {/* Recherche d'agent */}
      <wcs-card style={{ marginBottom: '24px', padding: '20px' }}>
        <h4>Rechercher un agent</h4>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
          <wcs-form-field label="Code Personnel" style={{ flex: 1, minWidth: '200px' }}>
            <wcs-input
              value={searchCode}
              onInput={(e) => setSearchCode(e.target.value)}
              placeholder="Ex: 1234567A"
              disabled={loading}
            />
          </wcs-form-field>
          <wcs-button 
            color="primary" 
            onClick={searchAgent}
            disabled={loading || !searchCode.trim()}
          >
            {loading ? <wcs-spinner size="small" /> : 'Rechercher'}
          </wcs-button>
        </div>
      </wcs-card>

      {/* Informations de l'agent sélectionné */}
      {selectedAgent && (
        <wcs-card style={{ marginBottom: '24px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4>Informations de l'agent</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <wcs-button 
                color="info"
                size="s"
                onClick={() => {
                  setShowHistory(true);
                  fetchHistory(selectedAgent.code_personnel);
                }}
                disabled={loading}
              >
                📋 Historique
              </wcs-button>
              <wcs-button 
                color={editMode ? 'secondary' : 'warning'}
                size="s"
                onClick={() => setEditMode(!editMode)}
                disabled={loading}
              >
                {editMode ? 'Annuler' : '✏️ Modifier'}
              </wcs-button>
              {editMode && (
                <wcs-button 
                  color="primary"
                  size="s"
                  onClick={handleUpdateAgent}
                  disabled={loading}
                >
                  {loading ? <wcs-spinner size="small" /> : 'Sauvegarder'}
                </wcs-button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {/* Code Personnel (non modifiable) */}
            <wcs-form-field label="Code Personnel">
              <wcs-input
                value={selectedAgent.code_personnel}
                disabled
                style={{ backgroundColor: '#f8f9fa' }}
              />
            </wcs-form-field>

            {/* Nom */}
            <wcs-form-field label="Nom">
              <wcs-input
                value={editMode ? editForm.nom : selectedAgent.nom}
                onInput={(e) => editMode && setEditForm(prev => ({ ...prev, nom: e.target.value }))}
                disabled={!editMode}
                style={{ backgroundColor: !editMode ? '#f8f9fa' : 'white' }}
              />
            </wcs-form-field>

            {/* Prénom */}
            <wcs-form-field label="Prénom">
              <wcs-input
                value={editMode ? editForm.prenom : selectedAgent.prenom}
                onInput={(e) => editMode && setEditForm(prev => ({ ...prev, prenom: e.target.value }))}
                disabled={!editMode}
                style={{ backgroundColor: !editMode ? '#f8f9fa' : 'white' }}
              />
            </wcs-form-field>

            {/* Nombre de proches */}
            <wcs-form-field label="Nombre de proches">
              <wcs-input
                type="number"
                min="0"
                max="4"
                value={editMode ? editForm.nombre_proches : selectedAgent.nombre_proches}
                onInput={(e) => editMode && setEditForm(prev => ({ ...prev, nombre_proches: parseInt(e.target.value) || 0 }))}
                disabled={!editMode}
                style={{ backgroundColor: !editMode ? '#f8f9fa' : 'white' }}
              />
            </wcs-form-field>

            {/* Heure d'arrivée */}
            <wcs-form-field label="Heure d'arrivée">
              {editMode ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <wcs-input
                    value={editForm.heure_arrivee || 'Aucun créneau sélectionné'}
                    disabled
                    style={{ backgroundColor: '#f8f9fa', flex: 1 }}
                  />
                  <wcs-button
                    color="secondary"
                    size="s"
                    onClick={() => setShowCreneauxSelector(true)}
                    disabled={loadingCreneaux}
                  >
                    {loadingCreneaux ? <wcs-spinner size="small" /> : '📅 Choisir'}
                  </wcs-button>
                </div>
              ) : (
                <wcs-input
                  value={selectedAgent.heure_arrivee}
                  disabled
                  style={{ backgroundColor: '#f8f9fa' }}
                />
              )}
            </wcs-form-field>

            {/* Statut */}
            <wcs-form-field label="Statut">
              {editMode ? (
                <wcs-select
                  ref={statutSelectRef}
                  value={editForm.statut}
                  disabled={loading}
                >
                  {STATUTS.map(statut => (
                    <wcs-select-option key={statut.value} value={statut.value}>
                      {statut.label}
                    </wcs-select-option>
                  ))}
                </wcs-select>
              ) : (
                <wcs-input
                  value={STATUTS.find(s => s.value === selectedAgent.statut)?.label || selectedAgent.statut}
                  disabled
                  style={{ backgroundColor: '#f8f9fa' }}
                />
              )}
            </wcs-form-field>
          </div>

          {/* Restauration sur place */}
          <div style={{ marginTop: '16px' }}>
            <wcs-form-field>
              <wcs-checkbox
                ref={checkboxRestaurationRef}
                checked={editMode ? editForm.restauration_sur_place : (selectedAgent.restauration_sur_place === 1 || selectedAgent.restauration_sur_place === '1' || selectedAgent.restauration_sur_place === true)}
                disabled={!editMode}
              >
                Intéressé(e) par la restauration sur place
              </wcs-checkbox>
            </wcs-form-field>
          </div>

          {/* Note */}
          <div style={{ marginTop: '16px' }}>
            <wcs-form-field label="Note">
              <wcs-textarea
                value={editMode ? editForm.note : (selectedAgent.note || '')}
                onInput={(e) => editMode && setEditForm(prev => ({ ...prev, note: e.target.value }))}
                disabled={!editMode}
                rows={3}
                placeholder={editMode ? "Ajouter une note..." : "Aucune note"}
                style={{ backgroundColor: !editMode ? '#f8f9fa' : 'white' }}
              />
            </wcs-form-field>
          </div>

          {/* Informations supplémentaires */}
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <h5 style={{ margin: '0 0 8px 0' }}>Informations supplémentaires</h5>
            <div style={{ display: 'grid', gap: '8px', fontSize: '0.9em', color: '#666' }}>
              <div><strong>Date d'inscription:</strong> {selectedAgent.date_inscription ? new Date(selectedAgent.date_inscription).toLocaleString('fr-FR') : 'Non renseignée'}</div>
              <div><strong>Dernière modification:</strong> {selectedAgent.updated_at ? new Date(selectedAgent.updated_at).toLocaleString('fr-FR') : 'Jamais modifié'}</div>
              <div><strong>Total de personnes:</strong> {parseInt(selectedAgent.nombre_proches || 0) + 1} personne{parseInt(selectedAgent.nombre_proches || 0) + 1 > 1 ? 's' : ''}</div>
              <div><strong>Restauration sur place:</strong> {(selectedAgent.restauration_sur_place === 1 || selectedAgent.restauration_sur_place === '1' || selectedAgent.restauration_sur_place === true) ? 'Oui' : 'Non'}</div>
              {selectedAgent.heure_validation && (
                <div><strong>Heure de pointage:</strong> {new Date(selectedAgent.heure_validation).toLocaleString('fr-FR')}</div>
              )}
            </div>
          </div>
        </wcs-card>
      )}

      {/* Liste de tous les agents (compacte) */}
      <wcs-card>
        <div style={{ padding: '20px' }}>
          <h4>Liste de tous les agents ({agents.length})</h4>
          {loading && <wcs-spinner style={{ display: 'block', margin: '16px auto' }} />}
          
          {!loading && agents.length === 0 && (
            <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
              Aucun agent trouvé
            </p>
          )}
          
          {!loading && agents.length > 0 && (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e9ecef' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Code</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Nom</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Prénom</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Proches</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Heure</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Statut</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Restauration</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map(agent => (
                    <tr key={agent.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.9em' }}>
                        {agent.code_personnel}
                      </td>
                      <td style={{ padding: '8px 12px' }}>{agent.nom}</td>
                      <td style={{ padding: '8px 12px' }}>{agent.prenom}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>{agent.nombre_proches}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>{agent.heure_arrivee}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '0.8em',
                          backgroundColor: 
                            agent.statut === 'present' ? '#d4edda' :
                            agent.statut === 'inscrit' ? '#d1ecf1' :
                            agent.statut === 'absent' ? '#fff3cd' :
                            agent.statut === 'annule' ? '#f8d7da' : '#e2e3e5',
                          color:
                            agent.statut === 'present' ? '#155724' :
                            agent.statut === 'inscrit' ? '#0c5460' :
                            agent.statut === 'absent' ? '#856404' :
                            agent.statut === 'annule' ? '#721c24' : '#383d41'
                        }}>
                          {STATUTS.find(s => s.value === agent.statut)?.label || agent.statut}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '0.8em',
                          backgroundColor: 
                            (agent.restauration_sur_place === 1 || agent.restauration_sur_place === '1' || agent.restauration_sur_place === true) ? '#d4edda' : '#f8d7da',
                          color:
                            (agent.restauration_sur_place === 1 || agent.restauration_sur_place === '1' || agent.restauration_sur_place === true) ? '#155724' : '#721c24'
                        }}>
                          {(agent.restauration_sur_place === 1 || agent.restauration_sur_place === '1' || agent.restauration_sur_place === true) ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <wcs-button
                          size="s"
                          shape="outline"
                          onClick={() => {
                            setSearchCode(agent.code_personnel);
                            setSelectedAgent(agent);
                            setEditForm({
                              nom: agent.nom || '',
                              prenom: agent.prenom || '',
                              nombre_proches: agent.nombre_proches || 0,
                              heure_arrivee: agent.heure_arrivee || '',
                              statut: agent.statut || 'inscrit',
                              restauration_sur_place: agent.restauration_sur_place === 1 || agent.restauration_sur_place === '1' || agent.restauration_sur_place === true,
                              note: agent.note || ''
                            });
                            setEditMode(false);
                          }}
                        >
                          Sélectionner
                        </wcs-button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </wcs-card>

      {/* Modal de sélection de créneaux */}
      {showCreneauxSelector && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            maxWidth: 800,
            width: '95%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
              <h3 style={{ margin: 0 }}>📅 Sélectionner un nouveau créneau</h3>
              <button 
                onClick={() => setShowCreneauxSelector(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: 24, 
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '6px', borderLeft: '4px solid #1976d2' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                Agent: {selectedAgent?.prenom} {selectedAgent?.nom} ({selectedAgent?.code_personnel})
              </div>
              <div style={{ fontSize: '0.9em', color: '#666' }}>
                Nombre de proches: {editForm.nombre_proches} • Total personnes: {parseInt(editForm.nombre_proches) + 1}
              </div>
              {selectedAgent?.heure_arrivee && (
                <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                  Créneau actuel: {selectedAgent.heure_arrivee} ({selectedAgent.heure_arrivee < '12:00' ? 'Matin' : 'Après-midi'})
                </div>
              )}
            </div>
            
            {loadingCreneaux ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <wcs-spinner style={{ display: 'block', margin: '0 auto 16px' }} />
                <p>Chargement des créneaux disponibles...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {/* Créneaux Matin */}
                <div style={{ flex: 1, minWidth: 350 }}>
                  <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🌅 Créneaux Matin (9h00 - 11h40)
                  </h4>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {creneauxMatin.map(heure => {
                      const disponibilite = getCreneauDisponibilite(heure, parseInt(editForm.nombre_proches));
                      const estActuel = selectedAgent?.heure_arrivee === heure;
                      const peutReserver = !disponibilite.complet_simule || estActuel;
                      
                      return (
                        <div 
                          key={heure}
                          onClick={() => peutReserver && setEditForm(prev => ({ ...prev, heure_arrivee: heure }))}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '6px',
                            border: editForm.heure_arrivee === heure ? '2px solid #1976d2' : '1px solid #e0e0e0',
                            backgroundColor: 
                              editForm.heure_arrivee === heure ? '#e3f2fd' :
                              !peutReserver ? '#ffebee' :
                              disponibilite.places_restantes_simule <= 3 ? '#fff3e0' : 
                              '#f8f9fa',
                            cursor: peutReserver ? 'pointer' : 'not-allowed',
                            opacity: peutReserver ? 1 : 0.6,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{heure}</div>
                            <div style={{ fontSize: '0.9em', color: '#666' }}>
                              {disponibilite.personnes_total_simule}/14 personnes
                            </div>
                          </div>
                          <div style={{ marginTop: '4px', fontSize: '0.8em', display: 'flex', gap: 16 }}>
                            <span>Agents: {disponibilite.agents_inscrits}</span>
                            <span style={{ 
                              color: disponibilite.complet_simule ? '#d32f2f' : 
                                     disponibilite.places_restantes_simule <= 3 ? '#f57c00' : '#388e3c',
                              fontWeight: 500
                            }}>
                              {disponibilite.complet_simule ? 'COMPLET' : 
                               disponibilite.places_restantes_simule <= 3 ? `${disponibilite.places_restantes_simule} places restantes` :
                               'DISPONIBLE'}
                            </span>
                          </div>
                          {estActuel && (
                            <div style={{ marginTop: '4px', fontSize: '0.8em', color: '#1976d2', fontWeight: 500 }}>
                              📍 Créneau actuel
                            </div>
                          )}
                          {editForm.heure_arrivee === heure && (
                            <div style={{ marginTop: '4px', fontSize: '0.8em', color: '#1976d2', fontWeight: 500 }}>
                              ✓ Sélectionné
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Créneaux Après-midi */}
                <div style={{ flex: 1, minWidth: 350 }}>
                  <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🌆 Créneaux Après-midi (13h00 - 15h40)
                  </h4>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {creneauxApresMidi.map(heure => {
                      const disponibilite = getCreneauDisponibilite(heure, parseInt(editForm.nombre_proches));
                      const estActuel = selectedAgent?.heure_arrivee === heure;
                      const peutReserver = !disponibilite.complet_simule || estActuel;
                      
                      return (
                        <div 
                          key={heure}
                          onClick={() => peutReserver && setEditForm(prev => ({ ...prev, heure_arrivee: heure }))}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '6px',
                            border: editForm.heure_arrivee === heure ? '2px solid #1976d2' : '1px solid #e0e0e0',
                            backgroundColor: 
                              editForm.heure_arrivee === heure ? '#e3f2fd' :
                              !peutReserver ? '#ffebee' :
                              disponibilite.places_restantes_simule <= 3 ? '#fff3e0' : 
                              '#f8f9fa',
                            cursor: peutReserver ? 'pointer' : 'not-allowed',
                            opacity: peutReserver ? 1 : 0.6,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{heure}</div>
                            <div style={{ fontSize: '0.9em', color: '#666' }}>
                              {disponibilite.personnes_total_simule}/14 personnes
                            </div>
                          </div>
                          <div style={{ marginTop: '4px', fontSize: '0.8em', display: 'flex', gap: 16 }}>
                            <span>Agents: {disponibilite.agents_inscrits}</span>
                            <span style={{ 
                              color: disponibilite.complet_simule ? '#d32f2f' : 
                                     disponibilite.places_restantes_simule <= 3 ? '#f57c00' : '#388e3c',
                              fontWeight: 500
                            }}>
                              {disponibilite.complet_simule ? 'COMPLET' : 
                               disponibilite.places_restantes_simule <= 3 ? `${disponibilite.places_restantes_simule} places restantes` :
                               'DISPONIBLE'}
                            </span>
                          </div>
                          {estActuel && (
                            <div style={{ marginTop: '4px', fontSize: '0.8em', color: '#1976d2', fontWeight: 500 }}>
                              📍 Créneau actuel
                            </div>
                          )}
                          {editForm.heure_arrivee === heure && (
                            <div style={{ marginTop: '4px', fontSize: '0.8em', color: '#1976d2', fontWeight: 500 }}>
                              ✓ Sélectionné
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: 16 }}>
              <wcs-button 
                color="secondary"
                onClick={() => setShowCreneauxSelector(false)}
              >
                Annuler
              </wcs-button>
              <wcs-button 
                color="primary"
                onClick={() => setShowCreneauxSelector(false)}
                disabled={!editForm.heure_arrivee}
              >
                Confirmer la sélection
              </wcs-button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'historique des modifications */}
      {showHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            maxWidth: 800,
            width: '95%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
              <h3 style={{ margin: 0 }}>📋 Historique des modifications</h3>
              <button 
                onClick={() => setShowHistory(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: 24, 
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                Agent: {selectedAgent?.prenom} {selectedAgent?.nom} ({selectedAgent?.code_personnel})
              </div>
              <div style={{ fontSize: '0.9em', color: '#666' }}>
                Dernière modification: {selectedAgent?.updated_at ? new Date(selectedAgent.updated_at).toLocaleString('fr-FR') : 'Jamais modifié'}
              </div>
            </div>
            
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <wcs-spinner style={{ display: 'block', margin: '0 auto 16px' }} />
                <p>Chargement de l'historique...</p>
              </div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>Aucune modification trouvée pour cet agent.</p>
              </div>
            ) : (
              <div style={{ maxHeight: '500px', overflow: 'auto' }}>
                {history.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    style={{
                      padding: '16px',
                      borderBottom: index < history.length - 1 ? '1px solid #f1f3f4' : 'none',
                      backgroundColor: index % 2 === 0 ? '#fafafa' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
                        {getFieldDisplayName(entry.field_name)}
                      </div>
                      <div style={{ fontSize: '0.8em', color: '#666' }}>
                        {new Date(entry.modification_date).toLocaleString('fr-FR')}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gap: '8px', fontSize: '0.9em' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: '#d32f2f' }}>Ancienne valeur:</span>
                        <span style={{ 
                          padding: '2px 6px', 
                          backgroundColor: '#ffebee', 
                          borderRadius: '3px',
                          fontFamily: 'monospace'
                        }}>
                          {formatHistoryValue(entry.field_name, entry.old_value)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: '#388e3c' }}>Nouvelle valeur:</span>
                        <span style={{ 
                          padding: '2px 6px', 
                          backgroundColor: '#e8f5e8', 
                          borderRadius: '3px',
                          fontFamily: 'monospace'
                        }}>
                          {formatHistoryValue(entry.field_name, entry.new_value)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: '#666' }}>Modifié par:</span>
                        <span style={{ 
                          padding: '2px 6px', 
                          backgroundColor: '#f0f0f0', 
                          borderRadius: '3px',
                          fontSize: '0.8em'
                        }}>
                          {entry.modified_by}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: 16 }}>
              <wcs-button 
                color="secondary"
                onClick={() => setShowHistory(false)}
              >
                Fermer
              </wcs-button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}