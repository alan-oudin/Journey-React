import React, { useState, useEffect, useRef, useCallback } from 'react';
import StatCard from '../components/StatCard';
import { apiGet, apiPut, apiDelete } from '../api';
import { ENV_CONFIG } from '../config/environment';

const STATUTS = [
  { value: 'tous', label: 'Tous' },
  { value: 'inscrit', label: 'Inscrits' },
  { value: 'present', label: 'Présents' },
  { value: 'absent', label: 'Absents' },
  { value: 'annule', label: 'Annulés' }
];

const creneauxMatin = [
  '09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00', '11:20', '11:40','12:00','12:20','12:40'
];
const creneauxApresMidi = [
  '13:00', '13:20', '13:40', '14:00', '14:20', '14:40', '15:00'
];

// Composant Select avec gestion native des événements WCS
function WcsSelectStatut({ agent, onChangeStatut, disabled }) {
  const selectRef = useRef(null);
  
  useEffect(() => {
    const selectElement = selectRef.current;
    if (selectElement) {
      const handleWcsChangeEvent = (event) => {
        onChangeStatut(agent.code_personnel, event.detail.value);
      };
      
      selectElement.addEventListener('wcsChange', handleWcsChangeEvent);
      
      return () => {
        selectElement.removeEventListener('wcsChange', handleWcsChangeEvent);
      };
    }
  }, [agent.code_personnel, onChangeStatut]);
  
  return (
    <wcs-select
      ref={selectRef}
      value={agent.statut}
      disabled={disabled}
    >
      {STATUTS.filter(s => s.value !== 'tous').map(s => (
        <wcs-select-option key={s.value} value={s.value}>{s.label}</wcs-select-option>
      ))}
    </wcs-select>
  );
}

export default function GestionPage() {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [creneaux, setCreneaux] = useState({ matin: {}, 'apres-midi': {} });
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);
  const [fieldAlerts, setFieldAlerts] = useState({});
  const [modalAgent, setModalAgent] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteMode, setNoteMode] = useState('add'); // 'add', 'edit', 'view'
  const [actionLoading, setActionLoading] = useState(false);
  const timeoutRefs = useRef({});

  // Fonction pour définir les alertes (sans timeout JavaScript)
  const setAlert = useCallback((field, alertData) => {
    setFieldAlerts(prev => ({
      ...prev,
      [field]: alertData
    }));
  }, []);

  const fetchAgents = useCallback(() => {
    setLoading(true);
    apiGet('agents')
      .then(data => {
        setAgents(Array.isArray(data) ? data : []);
      })
      .catch(e => {
        setAlert('fetch_error', {
          message: e.message,
          type: 'error'
        });
      })
      .finally(() => setLoading(false));
  }, [setAlert]);

  const fetchStats = () => {
    apiGet('stats')
      .then(data => setStats(data))
      .catch(() => setStats(null));
  };

  const fetchCreneaux = () => {
    setLoadingCreneaux(true);
    apiGet('creneaux')
      .then(data => setCreneaux(data))
      .catch(() => setCreneaux({ matin: {}, 'apres-midi': {} }))
      .finally(() => setLoadingCreneaux(false));
  };

  // Cleanup des timeouts lors du démontage du composant
  useEffect(() => {
    const currentTimeouts = timeoutRefs.current;
    return () => {
      Object.values(currentTimeouts).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  useEffect(() => {
    fetchAgents();
    fetchStats();
    fetchCreneaux();
  }, [fetchAgents]);

  // Fonction pour fermer manuellement une alerte
  const closeAlert = (field) => {
    // Annuler le timeout si il existe
    if (timeoutRefs.current[field]) {
      clearTimeout(timeoutRefs.current[field]);
      delete timeoutRefs.current[field];
    }
    
    // Supprimer l'alerte
    setFieldAlerts(prev => {
      const newAlerts = {...prev};
      delete newAlerts[field];
      return newAlerts;
    });
  };

  const handleSupprimer = async codePersonnel => {
    if (!window.confirm('Supprimer cet agent ?')) return;
    setLoading(true);
    try {
      const data = await apiDelete('agents', { code: codePersonnel });
      
      if (data.success) {
        setAlert('success', {
          message: 'Agent supprimé avec succès.',
          type: 'success'
        });
        fetchAgents();
        fetchStats();
        fetchCreneaux();
      } else {
        setAlert('delete_error', {
          message: data.error || 'Erreur lors de la suppression',
          type: 'error'
        });
      }
    } catch (e) {
      setAlert('delete_error', {
        message: e.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatut = async (codePersonnel, nouveauStatut) => {
    setLoading(true);
    try {
      const data = await apiPut('agents', {
        statut: nouveauStatut
      }, {
        code: codePersonnel
      });
      
      if (data.success) {
        setAlert('success', {
          message: 'Statut modifié avec succès.',
          type: 'success'
        });
        fetchAgents();
        fetchStats();
        fetchCreneaux();
      } else {
        setAlert('status_error', {
          message: data.error || 'Erreur lors de la modification du statut',
          type: 'error'
        });
      }
    } catch (e) {
      setAlert('status_error', {
        message: e.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Use the same API_BASE from api.js
    const API_BASE = ENV_CONFIG.API_BASE_URL;
    const url = new URL(API_BASE);
    url.searchParams.append('path', 'export');
    window.open(url.toString(), '_blank');
  };

  // Fonctions de gestion des notes
  const handleAjouterNote = (agent) => {
    setModalAgent(agent);
    setNoteMode('add');
    setShowNoteModal(true);
    setNoteText('');
  };

  const handleVoirNote = (agent) => {
    setModalAgent(agent);
    setNoteMode('view');
    setShowNoteModal(true);
    setNoteText(agent?.note || '');
  };

  const handleModifierNote = (agent) => {
    setModalAgent(agent);
    setNoteMode('edit');
    setShowNoteModal(true);
    setNoteText(agent?.note || '');
  };

  const handleSupprimerNote = async (agent) => {
    if (!window.confirm('Supprimer la note de cet agent ?')) return;
    
    setActionLoading(true);
    try {
      const data = await apiPut('agents', {
        note: null
      }, {
        code: agent.code_personnel
      });
      
      if (data.success) {
        setAlert('success', {
          message: 'Note supprimée avec succès.',
          type: 'success'
        });
        fetchAgents();
        // Mettre à jour modalAgent si elle est ouverte
        if (modalAgent && modalAgent.code_personnel === agent.code_personnel) {
          setModalAgent(prev => ({ ...prev, note: null }));
        }
      } else {
        setAlert('note_error', {
          message: data.error || 'Erreur lors de la suppression de la note',
          type: 'error'
        });
      }
    } catch (e) {
      setAlert('note_error', {
        message: e.message || 'Erreur de connexion au serveur',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSauvegarderNote = async () => {
    if (!modalAgent || !noteText.trim()) {
      setShowNoteModal(false);
      return;
    }
    
    setActionLoading(true);
    try {
      const data = await apiPut('agents', {
        note: noteText.trim()
      }, {
        code: modalAgent.code_personnel
      });
      
      if (data.success) {
        setAlert('success', {
          message: noteMode === 'add' ? 'Note ajoutée avec succès.' : 'Note modifiée avec succès.',
          type: 'success'
        });
        setShowNoteModal(false);
        fetchAgents();
        // Mettre à jour modalAgent
        setModalAgent(prev => ({ ...prev, note: noteText.trim() }));
      } else {
        setAlert('note_error', {
          message: data.error || 'Erreur lors de la sauvegarde de la note',
          type: 'error'
        });
      }
    } catch (e) {
      setAlert('note_error', {
        message: e.message || 'Erreur de connexion au serveur',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtrage des agents selon le statut sélectionné
  const agentsFiltres = agents.filter(agent => {
    if (filtreStatut === 'tous') return true; // Afficher vraiment tous les agents
    return agent.statut === filtreStatut;
  });

  return (
    <div className="gestion-container" style={{padding: '40px 20px'}}>
      <h2>👥 Gestion des inscriptions</h2>
      <p>Journée des Proches - Vue d'ensemble et administration</p>

      {/* Alertes WCS */}
      <wcs-alert-drawer>
        {Object.keys(fieldAlerts).map(field => (
          <wcs-alert 
            key={field} 
            intent={fieldAlerts[field].type === 'success' ? 'success' : 'error'} 
            show={true}
            timeout={5000}
            show-progress-bar={true}
            style={{ marginBottom: 16 }}
          >
            <span slot="title">
              {fieldAlerts[field].type === 'success' ? 'Succès' : 'Erreur'}
            </span>
            <span slot="subtitle">
              {fieldAlerts[field].message}
            </span>
            <wcs-button 
              slot="action" 
              shape="clear" 
              onClick={() => closeAlert(field)}
            >
              Fermer
            </wcs-button>
          </wcs-alert>
        ))}
      </wcs-alert-drawer>

      {loading && <wcs-spinner style={{ display: 'block', margin: '16px auto' }}></wcs-spinner>}

      <div className="form-columns">
        <div className="form-left">
          <div style={{display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24,justifyContent:'center'}}>
            <StatCard number={stats ? stats.total_agents : agents.length} label="Total agents" />
            <StatCard number={stats ? stats.agents_presents : 0} label="Présents" />
            <StatCard number={stats ? stats.agents_inscrits : 0} label="Inscrits" />
            <StatCard number={stats ? stats.agents_absents : 0} label="Absents" />
            <StatCard number={stats ? stats.total_personnes : 0} label="Total personnes" />
          </div>

          <wcs-button color="primary" style={{marginTop: 16, marginBottom: 16,display:'flex'}} onClick={handleExportCSV} disabled={loading || agents.length === 0}>
            📊 Exporter CSV
          </wcs-button>

          <h3 style={{marginTop: '2rem',textAlign:'center'}}>Disponibilité des créneaux</h3>
          {loadingCreneaux ? (
            <wcs-spinner style={{ display: 'block', margin: '16px auto' }}></wcs-spinner>
          ) : (
            <div style={{display: 'flex', gap: 32, flexWrap: 'wrap',justifyContent: 'center'}}>
              <wcs-card mode="flat" style={{minWidth: 280, width: '100%', maxWidth: 400}}>
                <wsc-card-body>
                  <wsc-card-header>
                    <span style={{fontWeight: 'bold', fontSize: '1.1em', textAlign: 'center', display: 'block',marginBlock:'15px'}}>🌅 Matin (9h00 - 12h40)</span>
                  </wsc-card-header>
                <wcs-divider style={{margin: '8px 0 8px 0'}}></wcs-divider>
                  <wsc-card-content>
                      <table style={{borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed'}}>
                        <thead>
                          <tr>
                            <th style={{padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold', fontSize: '0.95em', whiteSpace: 'nowrap'}}>Heure</th>
                            <th style={{padding: '6px 4px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold', fontSize: '0.95em'}}>Ag.</th>
                            <th style={{padding: '6px 4px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold', fontSize: '0.95em'}}>Pers.</th>
                            <th style={{padding: '6px 4px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold', fontSize: '0.95em'}}>Libres</th>
                            <th style={{padding: '6px 4px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold', fontSize: '0.95em'}}>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creneauxMatin.map(heure => {
                            const info = creneaux.matin[heure] || { agents_inscrits: 0, personnes_total: 0, places_restantes: 14, complet: false };
                            return (
                              <tr key={heure} style={{background: info.complet ? '#ffeaea' : info.places_restantes <= 3 ? '#fffbe6' : 'white'}}>
                                <td style={{padding: '6px 8px', textAlign: 'left', fontSize: '0.95em', whiteSpace: 'nowrap'}}>{heure}</td>
                                <td style={{padding: '6px 4px', textAlign: 'center', fontSize: '0.95em'}}>{info.agents_inscrits}</td>
                                <td style={{padding: '6px 4px', textAlign: 'center', fontSize: '0.95em'}}>{info.personnes_total}</td>
                                <td style={{padding: '6px 4px', textAlign: 'center', fontSize: '0.95em'}}>{info.places_restantes}</td>
                                <td style={{padding: '6px 4px', textAlign: 'center', fontSize: '0.85em'}}>
                                  {info.complet ? <span style={{color: 'red'}}>COMPLET</span> : info.places_restantes <= 3 ? <span style={{color: 'orange'}}>⚡ Limité</span> : <span style={{color: 'green'}}>LIBRE</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                  </wsc-card-content>
                </wsc-card-body>
              </wcs-card>
              <wcs-card mode="flat" style={{minWidth: 280, width: '100%', maxWidth: 400}}>
                <wsc-card-body>
                  <wsc-card-header>
                    <span style={{fontWeight: 'bold', fontSize: '1.1em', textAlign: 'center', display: 'block',marginBlock:'15px'}}>🌆 Après-midi (13h00 - 15h00)</span>
                  </wsc-card-header>
                <wcs-divider style={{margin: '8px 0 8px 0'}}></wcs-divider>
                  <wsc-card-content>
                      <table style={{borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed'}}>
                        <thead>
                          <tr>
                            <th style={{padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold', fontSize: '0.95em', whiteSpace: 'nowrap'}}>Heure</th>
                            <th style={{padding: '6px 4px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold', fontSize: '0.95em'}}>Ag.</th>
                            <th style={{padding: '6px 4px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold', fontSize: '0.95em'}}>Pers.</th>
                            <th style={{padding: '6px 4px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold', fontSize: '0.95em'}}>Libres</th>
                            <th style={{padding: '6px 4px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', fontWeight: 'bold', fontSize: '0.95em'}}>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creneauxApresMidi.map(heure => {
                            const info = creneaux['apres-midi'][heure] || { agents_inscrits: 0, personnes_total: 0, places_restantes: 14, complet: false };
                            return (
                              <tr key={heure} style={{background: info.complet ? '#ffeaea' : info.places_restantes <= 3 ? '#fffbe6' : 'white'}}>
                                <td style={{padding: '6px 8px', textAlign: 'left', fontSize: '0.95em', whiteSpace: 'nowrap'}}>{heure}</td>
                                <td style={{padding: '6px 4px', textAlign: 'center', fontSize: '0.95em'}}>{info.agents_inscrits}</td>
                                <td style={{padding: '6px 4px', textAlign: 'center', fontSize: '0.95em'}}>{info.personnes_total}</td>
                                <td style={{padding: '6px 4px', textAlign: 'center', fontSize: '0.95em'}}>{info.places_restantes}</td>
                                <td style={{padding: '6px 4px', textAlign: 'center', fontSize: '0.85em'}}>
                                  {info.complet ? <span style={{color: 'red'}}>COMPLET</span> : info.places_restantes <= 3 ? <span style={{color: 'orange'}}>⚡ Limité</span> : <span style={{color: 'green'}}>LIBRE</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                  </wsc-card-content>
                </wsc-card-body>
              </wcs-card>
            </div>
          )}
        </div>
        
        <div className="form-separator"></div>
        
        <div className="form-right">
          <h3 style={{textAlign:'center'}}>Liste des agents inscrits</h3>
          <strong>Filtrer par statut :</strong>{' '}
          <div style={{margin: '24px 0'}}>
            <wcs-button-group>
              {STATUTS.map(s => (
                <wcs-button
                  key={s.value}
                  color={filtreStatut === s.value ? 'primary' : 'secondary'}
                  onClick={() => setFiltreStatut(s.value)}
                  disabled={loading}
                  style={{marginRight: 8, marginBottom: 8}}
                >
                  {s.label}
                </wcs-button>
              ))}
            </wcs-button-group>
          </div>
          
          <div>
            {agentsFiltres.length === 0 && !loading && <p>Aucun agent pour ce filtre.</p>}
            {agentsFiltres.map(agent => (
              <wcs-card key={agent.code_personnel} style={{ 
                marginBottom: 8, 
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 'auto',
                flexDirection: 'row',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1,justifyContent:'space-between',flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 500, minWidth: 120 }}>
                    {agent.nom} {agent.prenom}
                  </div>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.9em', 
                    color: '#666',
                    minWidth: 80
                  }}>
                    {agent.code_personnel}
                  </div>
                  <div style={{ 
                    fontSize: '0.9em',
                    color: '#888',
                    minWidth: 80
                  }}>
                    {agent.heure_arrivee < '13:00' ? '🌅 Matin' : '🌆 Après-midi'}
                  </div>
                  <div style={{ minWidth: 100 }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 3,
                      fontSize: '0.8em',
                      fontWeight: 500,
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
                  </div>
                  <wcs-button
                      size="s"
                      shape="outline"
                      onClick={() => setModalAgent(agent)}
                  >
                    Détails
                  </wcs-button>
                </div>

              </wcs-card>
            ))}
          </div>
        </div>
      </div>

      {/* Modal personnalisé pour les détails d'un agent */}
      {modalAgent && (
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
            maxWidth: 500,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Détails de l'agent</h3>
              <button 
                onClick={() => setModalAgent(null)}
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
            
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <strong>Nom complet :</strong>
                <div style={{ marginTop: 4, fontSize: '1.1em' }}>
                  {modalAgent.nom} {modalAgent.prenom}
                </div>
              </div>
              
              <div>
                <strong>Code Personnel :</strong>
                <div style={{ marginTop: 4, fontFamily: 'monospace', fontSize: '1.1em' }}>
                  {modalAgent.code_personnel}
                </div>
              </div>
              
              <div>
                <strong>Nombre de proches :</strong>
                <div style={{ marginTop: 4 }}>
                  {modalAgent.nombre_proches} proche{modalAgent.nombre_proches > 1 ? 's' : ''}
                  {modalAgent.nombre_proches === 0 && ' (agent seul)'}
                </div>
              </div>
              
              <div>
                <strong>Créneau d'arrivée :</strong>
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{modalAgent.heure_arrivee < '13:00' ? '🌅' : '🌆'}</span>
                  <span>{modalAgent.heure_arrivee}</span>
                  <span style={{ color: '#666' }}>
                    ({modalAgent.heure_arrivee < '13:00' ? 'Matin' : 'Après-midi'})
                  </span>
                </div>
              </div>
              <div>
                  <strong>Statue :</strong>
                  <div style={{ marginTop: 4, minWidth: 100 }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 3,
                      fontSize: '0.8em',
                      fontWeight: 500,
                      backgroundColor:
                          modalAgent.statut === 'present' ? '#d4edda' :
                              modalAgent.statut === 'inscrit' ? '#d1ecf1' :
                                  modalAgent.statut === 'absent' ? '#fff3cd' :
                                      modalAgent.statut === 'annule' ? '#f8d7da' : '#e2e3e5',
                      color:
                          modalAgent.statut === 'present' ? '#155724' :
                              modalAgent.statut === 'inscrit' ? '#0c5460' :
                                  modalAgent.statut === 'absent' ? '#856404' :
                                      modalAgent.statut === 'annule' ? '#721c24' : '#383d41'
                    }}>
                      {STATUTS.find(s => s.value === modalAgent.statut)?.label || modalAgent.statut}
                    </span>
                  </div>
              </div>
              <div>
                <strong>Changer le statut :</strong>
                <div style={{ marginTop: 8 }}>
                  <WcsSelectStatut 
                    agent={modalAgent}
                    onChangeStatut={(codePersonnel, nouveauStatut) => {
                      handleChangeStatut(codePersonnel, nouveauStatut);
                      // Mettre à jour modalAgent pour refléter le changement immédiatement
                      setModalAgent(prev => ({...prev, statut: nouveauStatut}));
                    }}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div>
                <strong>Date d'inscription :</strong>
                <div style={{ marginTop: 4, color: '#666' }}>
                  {modalAgent.date_inscription ? new Date(modalAgent.date_inscription).toLocaleString('fr-FR') : 'Non renseignée'}
                </div>
              </div>
              
              <div>
                <strong>Total de personnes :</strong>
                <div style={{ marginTop: 4, fontSize: '1.1em', fontWeight: 500 }}>
                  {parseInt(modalAgent.nombre_proches) + 1} personne{parseInt(modalAgent.nombre_proches) + 1 > 1 ? 's' : ''}
                  <span style={{ color: '#666', fontSize: '0.9em', marginLeft: 8 }}>
                    (agent + {modalAgent.nombre_proches} proche{modalAgent.nombre_proches > 1 ? 's' : ''})
                  </span>
                </div>
              </div>


              {/* Section Note */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong>Note :</strong>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!modalAgent.note ? (
                      <wcs-button 
                        color="secondary" 
                        size="s"
                        disabled={actionLoading}
                        onClick={() => handleAjouterNote(modalAgent)}
                      >
                        📝 Ajouter
                      </wcs-button>
                    ) : (
                      <>
                        <wcs-button 
                          color="info" 
                          size="s"
                          disabled={actionLoading}
                          onClick={() => handleVoirNote(modalAgent)}
                        >
                          👁️ Voir
                        </wcs-button>
                        <wcs-button 
                          color="warning" 
                          size="s"
                          disabled={actionLoading}
                          onClick={() => handleModifierNote(modalAgent)}
                        >
                          ✏️ Modifier
                        </wcs-button>
                        <wcs-button 
                          color="danger" 
                          size="s"
                          disabled={actionLoading}
                          onClick={() => handleSupprimerNote(modalAgent)}
                        >
                          🗑️ Supprimer
                        </wcs-button>
                      </>
                    )}
                  </div>
                </div>
                {modalAgent.note && (
                  <div style={{
                    marginTop: 8,
                    padding: '8px 12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef',
                    maxHeight: '60px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      fontSize: '0.9em',
                      lineHeight: '1.3',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {modalAgent.note.length > 100 ? 
                        modalAgent.note.substring(0, 100) + '...' : 
                        modalAgent.note
                      }
                    </div>
                    {modalAgent.note.length > 100 && (
                      <div style={{ fontSize: '0.8em', color: '#6c757d', marginTop: '2px' }}>
                        Cliquez sur "Voir" pour le texte complet
                      </div>
                    )}
                  </div>
                )}
                {!modalAgent.note && (
                  <div style={{ 
                    marginTop: 8, 
                    fontSize: '0.9em', 
                    color: '#6c757d', 
                    fontStyle: 'italic' 
                  }}>
                    Aucune note ajoutée
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: 16 }}>
              <button 
                onClick={() => setModalAgent(null)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #6c757d',
                  backgroundColor: 'white',
                  color: '#6c757d',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
              <button 
                onClick={() => {
                  const codePersonnel = modalAgent.code_personnel;
                  setModalAgent(null);
                  handleSupprimer(codePersonnel);
                }}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #dc3545',
                  backgroundColor: 'white',
                  color: '#dc3545',
                  borderRadius: 4,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour ajouter/modifier/voir une note */}
      {showNoteModal && (
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
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>
                {noteMode === 'add' ? 'Ajouter une note' : 
                 noteMode === 'edit' ? 'Modifier la note' : 
                 'Note de l\'agent'}
              </h3>
              <button 
                onClick={() => setShowNoteModal(false)}
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
            
            <div style={{ marginBottom: 16 }}>
              <strong>Agent :</strong> {modalAgent?.prenom} {modalAgent?.nom} ({modalAgent?.code_personnel})
            </div>
            
            {noteMode === 'view' ? (
              <div>
                <strong style={{ display: 'block', marginBottom: '8px' }}>Note :</strong>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  minHeight: '100px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.4'
                }}>
                  {noteText || 'Aucune note'}
                </div>
              </div>
            ) : (
              <wcs-form-field>
                <wcs-label>Note</wcs-label>
                <wcs-textarea
                  value={noteText}
                  onInput={(e) => setNoteText(e.target.value)}
                  placeholder={noteMode === 'add' ? 
                    "Ajoutez une note concernant cet agent..." : 
                    "Modifiez la note de l'agent..."
                  }
                  rows={4}
                  disabled={actionLoading}
                ></wcs-textarea>
              </wcs-form-field>
            )}
            
            <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: noteMode === 'view' ? 'space-between' : 'flex-end' }}>
              {noteMode === 'view' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <wcs-button 
                    color="warning"
                    size="s"
                    onClick={() => {
                      setNoteMode('edit');
                    }}
                    disabled={actionLoading}
                  >
                    ✏️ Modifier
                  </wcs-button>
                  <wcs-button 
                    color="danger"
                    size="s"
                    onClick={() => {
                      setShowNoteModal(false);
                      handleSupprimerNote(modalAgent);
                    }}
                    disabled={actionLoading}
                  >
                    🗑️ Supprimer
                  </wcs-button>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: 12 }}>
                <wcs-button 
                  color="secondary"
                  onClick={() => setShowNoteModal(false)}
                  disabled={actionLoading}
                >
                  {noteMode === 'view' ? 'Fermer' : 'Annuler'}
                </wcs-button>
                {noteMode !== 'view' && (
                  <wcs-button 
                    color="primary"
                    onClick={handleSauvegarderNote}
                    disabled={actionLoading || !noteText.trim()}
                  >
                    {actionLoading ? <wcs-spinner size="small"></wcs-spinner> : 'Sauvegarder'}
                  </wcs-button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 