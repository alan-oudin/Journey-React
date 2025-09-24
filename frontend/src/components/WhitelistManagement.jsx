import React, { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost, apiDelete, apiPut } from '../api';
import { ENV_CONFIG } from '../config/environment';

export default function WhitelistManagement() {
  const [loading, setLoading] = useState(false);
  const [whitelist, setWhitelist] = useState([]);
  const [stats, setStats] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgent, setNewAgent] = useState({ codePersonnel: '', nom: '', prenom: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous'); // 'tous', 'actif', 'inactif'
  const fileInputRef = useRef(null);

  const addAlert = (message, type = 'info') => {
    const alert = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setAlerts(prev => [...prev, alert]);
    setTimeout(() => removeAlert(alert.id), 5000);
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const fetchWhitelist = async () => {
    setLoading(true);
    try {
      const response = await apiGet('whitelist/list');
      if (response.success) {
        setWhitelist(response.whitelist);
      } else {
        addAlert('Erreur lors de la récupération de la whitelist', 'error');
      }
    } catch (error) {
      addAlert(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiGet('whitelist');
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      // Erreur lors de la récupération des statistiques
    }
  };

  useEffect(() => {
    fetchWhitelist();
    fetchStats();
  }, []);

  const handleDownloadExample = () => {
    const API_BASE = ENV_CONFIG.API_BASE_URL;
    const url = new URL(API_BASE);
    url.searchParams.append('path', 'whitelist/download-example');
    window.open(url.toString(), '_blank');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setShowUploadModal(true);
      handleUploadCSV(file);
    }
  };

  const handleUploadCSV = async (file) => {
    setUploadLoading(true);
    setUploadResults(null);

    try {
      const formData = new FormData();
      formData.append('csv_file', file);

      const response = await fetch(`${ENV_CONFIG.API_BASE_URL}?path=whitelist/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setUploadResults(data.results);
        addAlert(data.message, 'success');
        fetchWhitelist();
        fetchStats();
      } else {
        addAlert(data.error || 'Erreur lors de l\'upload', 'error');
      }
    } catch (error) {
      addAlert(error.message, 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAddAgent = async () => {
    if (!newAgent.codePersonnel || !newAgent.nom || !newAgent.prenom) {
      addAlert('Tous les champs sont requis', 'error');
      return;
    }

    if (!/^[0-9]{7}[A-Za-z]{1}$/.test(newAgent.codePersonnel)) {
      addAlert('Format code personnel invalide (7 chiffres + 1 lettre)', 'error');
      return;
    }

    try {
      const response = await apiPost('whitelist', {
        code_personnel: newAgent.codePersonnel,
        nom: newAgent.nom,
        prenom: newAgent.prenom
      });
      if (response.success) {
        addAlert('Agent ajouté à la whitelist avec succès', 'success');
        setShowAddModal(false);
        setNewAgent({ codePersonnel: '', nom: '', prenom: '' });
        fetchWhitelist();
        fetchStats();
      } else {
        addAlert(response.message || 'Erreur lors de l\'ajout', 'error');
      }
    } catch (error) {
      addAlert(error.message, 'error');
    }
  };

  const handleDeactivateAgent = async (codePersonnel) => {
    if (!window.confirm(`Désactiver l'agent ${codePersonnel} ?`)) return;

    try {
      const response = await apiDelete('whitelist', { code: codePersonnel });
      if (response.success) {
        addAlert('Agent désactivé avec succès', 'success');
        fetchWhitelist();
        fetchStats();
      } else {
        addAlert(response.message || 'Erreur lors de la désactivation', 'error');
      }
    } catch (error) {
      addAlert(error.message, 'error');
    }
  };

  const handleReactivateAgent = async (codePersonnel) => {
    if (!window.confirm(`Réactiver l'agent ${codePersonnel} ?`)) return;

    try {
      const response = await apiPut('whitelist', { code: codePersonnel });
      if (response.success) {
        addAlert('Agent réactivé avec succès', 'success');
        fetchWhitelist();
        fetchStats();
      } else {
        addAlert(response.message || 'Erreur lors de la réactivation', 'error');
      }
    } catch (error) {
      addAlert(error.message, 'error');
    }
  };

  // Filtrer les agents selon la recherche et le statut
  const filteredWhitelist = whitelist.filter(agent => {
    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const codeMatch = agent.code_personnel.toLowerCase().includes(query);
      const nomMatch = agent.nom && agent.nom.toLowerCase().includes(query);
      const prenomMatch = agent.prenom && agent.prenom.toLowerCase().includes(query);
      
      if (!codeMatch && !nomMatch && !prenomMatch) {
        return false;
      }
    }
    
    // Filtre par statut - conversion plus robuste
    if (statusFilter === 'actif') {
      // Vérifier différents formats possibles pour "actif"
      return agent.actif === 1 || agent.actif === '1' || agent.actif === true || agent.actif === 'true';
    } else if (statusFilter === 'inactif') {
      // Vérifier différents formats possibles pour "inactif"
      return agent.actif === 0 || agent.actif === '0' || agent.actif === false || agent.actif === 'false' || agent.actif === null;
    }
    
    // 'tous' - afficher tous les agents
    return true;
  });

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Fonction utilitaire pour déterminer si un agent est actif
  const isAgentActive = (agent) => {
    const actif = agent.actif;
    return actif === 1 || actif === '1' || actif === true || actif === 'true';
  };

  return (
    <div className="whitelist-container" style={{padding: '40px 20px'}}>
      <h2>🔐 Gestion de la Whitelist</h2>
      <p>Contrôle des agents autorisés à s'inscrire</p>

      {/* Alertes */}
      <wcs-alert-drawer>
        {alerts.map(alert => (
          <wcs-alert 
            key={alert.id}
            intent={alert.type === 'success' ? 'success' : alert.type === 'error' ? 'error' : 'info'}
            show={true}
            timeout={5000}
            show-progress-bar={true}
            style={{ marginBottom: 16 }}
          >
            <span slot="title">
              {alert.type === 'success' ? 'Succès' : alert.type === 'error' ? 'Erreur' : 'Information'}
            </span>
            <span slot="subtitle">{alert.message}</span>
            <wcs-button 
              slot="action" 
              shape="clear" 
              onClick={() => removeAlert(alert.id)}
            >
              Fermer
            </wcs-button>
          </wcs-alert>
        ))}
      </wcs-alert-drawer>

      {loading && <wcs-spinner style={{ display: 'block', margin: '16px auto' }}></wcs-spinner>}

      {/* Statistiques */}
      <div className="form-columns">
        <div className="form-left">
          <h3 style={{textAlign:'center'}}>📊 Statistiques</h3>
          {stats && (
            <div style={{display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24, justifyContent:'center'}}>
              <wcs-card mode="flat" style={{minWidth: 120, textAlign: 'center', padding: '16px'}}>
                <wcs-card-body>
                  <div style={{fontSize: '2em', fontWeight: 'bold', color: '#0066cc'}}>{stats.total}</div>
                  <div style={{color: '#666'}}>Total</div>
                </wcs-card-body>
              </wcs-card>
              <wcs-card mode="flat" style={{minWidth: 120, textAlign: 'center', padding: '16px'}}>
                <wcs-card-body>
                  <div style={{fontSize: '2em', fontWeight: 'bold', color: '#28a745'}}>{stats.actifs}</div>
                  <div style={{color: '#666'}}>Actifs</div>
                </wcs-card-body>
              </wcs-card>
              <wcs-card mode="flat" style={{minWidth: 120, textAlign: 'center', padding: '16px'}}>
                <wcs-card-body>
                  <div style={{fontSize: '2em', fontWeight: 'bold', color: '#dc3545'}}>{stats.inactifs}</div>
                  <div style={{color: '#666'}}>Inactifs</div>
                </wcs-card-body>
              </wcs-card>
            </div>
          )}

          <h3 style={{textAlign:'center'}}>🛠️ Actions</h3>
          <div style={{display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24}}>
            <wcs-button 
              color="secondary" 
              onClick={handleDownloadExample}
            >
              📥 Télécharger exemple CSV
            </wcs-button>
            
            <wcs-button 
              color="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLoading}
            >
              📤 Importer CSV
            </wcs-button>
            
            <wcs-button 
              color="info"
              onClick={() => setShowAddModal(true)}
            >
              ➕ Ajouter un agent
            </wcs-button>
          </div>

          <input 
            ref={fileInputRef}
            type="file" 
            accept=".csv,.txt" 
            style={{display: 'none'}} 
            onChange={handleFileSelect}
          />

          {/* Instructions */}
          <wcs-card mode="flat" style={{marginTop: 24}}>
            <wcs-card-body>
              <h4>📋 Instructions</h4>
              <ol style={{paddingLeft: 20, lineHeight: 1.6}}>
                <li><strong>Téléchargez</strong> le fichier exemple CSV pour voir le format attendu</li>
                <li><strong>Préparez votre Excel</strong> avec 3 colonnes : Code Personnel, Nom, Prénom</li>
                <li><strong>Enregistrez en CSV</strong> (Format: CSV UTF-8)</li>
                <li><strong>Importez le fichier</strong> avec le bouton "Importer CSV"</li>
              </ol>
              <div style={{marginTop: 12, padding: '8px 12px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px'}}>
                <strong>⚠️ ATTENTION :</strong> L'import remplace complètement la whitelist existante. Toutes les données actuelles seront supprimées et remplacées par le contenu du fichier CSV.
              </div>
              <div style={{marginTop: 12, fontSize: '0.9em', color: '#666'}}>
                ⚠️ Format code personnel : 7 chiffres + 1 lettre (ex: 1234567A)<br/>
                🔒 Les données sont automatiquement hachées pour la sécurité RGPD
              </div>
            </wcs-card-body>
          </wcs-card>
        </div>
        
        <div className="form-separator"></div>
        
        <div className="form-right">
          <h3 style={{textAlign:'center'}}>👥 Liste des agents autorisés</h3>
          
          {/* Champ de recherche */}
          {whitelist.length > 0 && (
            <div style={{marginBottom: 20}}>
              <wcs-form-field>
                <wcs-label>🔍 Rechercher un agent</wcs-label>
                <div style={{position: 'relative'}}>
                  <wcs-input
                    value={searchQuery}
                    onInput={(e) => setSearchQuery(e.target.value)}
                    placeholder="Code personnel, nom ou prénom (ex: 1234567A ou Dupont)"
                    style={{paddingRight: searchQuery ? '40px' : '12px'}}
                  ></wcs-input>
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        color: '#666',
                        padding: '2px'
                      }}
                      title="Effacer la recherche"
                    >
                      ×
                    </button>
                  )}
                </div>
              </wcs-form-field>
              
              {/* Boutons de filtre par statut */}
              <div style={{marginTop: 16}}>
                <div style={{marginBottom: 8}}>
                  <strong style={{fontSize: '0.9em', color: '#333'}}>Filtrer par statut :</strong>
                </div>
                <wcs-button-group>
                  <wcs-button
                    color={statusFilter === 'tous' ? 'primary' : 'secondary'}
                    size="s"
                    onClick={() => setStatusFilter('tous')}
                  >
                    📋 Tous ({stats ? stats.total : whitelist.length})
                  </wcs-button>
                  <wcs-button
                    color={statusFilter === 'actif' ? 'primary' : 'secondary'}
                    size="s"
                    onClick={() => setStatusFilter('actif')}
                  >
                    ✅ Actifs ({stats ? stats.actifs : whitelist.filter(a => a.actif === 1 || a.actif === '1' || a.actif === true || a.actif === 'true').length})
                  </wcs-button>
                  <wcs-button
                    color={statusFilter === 'inactif' ? 'primary' : 'secondary'}
                    size="s"
                    onClick={() => setStatusFilter('inactif')}
                  >
                    ❌ Inactifs ({stats ? stats.inactifs : whitelist.filter(a => a.actif === 0 || a.actif === '0' || a.actif === false || a.actif === 'false' || a.actif === null).length})
                  </wcs-button>
                </wcs-button-group>
              </div>
              
              {/* Compteur de résultats */}
              <div style={{
                fontSize: '0.9em', 
                color: '#666', 
                marginTop: 12,
                textAlign: 'center'
              }}>
                {filteredWhitelist.length} agent{filteredWhitelist.length > 1 ? 's' : ''} affiché{filteredWhitelist.length > 1 ? 's' : ''}
                {(searchQuery || statusFilter !== 'tous') && filteredWhitelist.length < whitelist.length && 
                  ` sur ${whitelist.length} au total`
                }
              </div>
            </div>
          )}
          
          {whitelist.length === 0 && !loading && (
            <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
              <div style={{fontSize: '3em', marginBottom: 16}}>📋</div>
              <p>Aucun agent dans la whitelist</p>
              <p>Utilisez les boutons ci-dessus pour ajouter des agents</p>
            </div>
          )}
          
          {/* Message si aucun résultat de recherche */}
          {searchQuery && filteredWhitelist.length === 0 && whitelist.length > 0 && (
            <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
              <div style={{fontSize: '2em', marginBottom: 16}}>🔍</div>
              <p>Aucun agent trouvé pour "{searchQuery}"</p>
              <p>Vérifiez l'orthographe ou essayez un autre code personnel</p>
            </div>
          )}
          
          {filteredWhitelist.map(agent => (
            <wcs-card key={agent.code_personnel} style={{ 
              marginBottom: 8, 
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '1em', 
                  fontWeight: 'bold',
                  minWidth: 80
                }}>
                  {agent.code_personnel}
                </div>
                <div style={{
                  fontSize: '1em',
                  fontWeight: '500',
                  minWidth: 200
                }}>
                  {agent.nom && agent.prenom ? `${agent.prenom} ${agent.nom}` : 'Nom non disponible'}
                </div>
                <div style={{
                  fontSize: '0.9em',
                  color: '#666'
                }}>
                  {new Date(agent.created_at).toLocaleDateString('fr-FR')}
                </div>
                <div style={{ minWidth: 80 }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: 3,
                    fontSize: '0.8em',
                    fontWeight: 500,
                    backgroundColor: isAgentActive(agent) ? '#d4edda' : '#f8d7da',
                    color: isAgentActive(agent) ? '#155724' : '#721c24'
                  }}>
                    {isAgentActive(agent) ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                {isAgentActive(agent) ? (
                  <wcs-button
                    size="s"
                    color="danger"
                    shape="outline"
                    onClick={() => handleDeactivateAgent(agent.code_personnel)}
                  >
                    🚫 Désactiver
                  </wcs-button>
                ) : (
                  <wcs-button
                    size="s"
                    color="success"
                    shape="outline"
                    onClick={() => handleReactivateAgent(agent.code_personnel)}
                  >
                    ✅ Réactiver
                  </wcs-button>
                )}
              </div>
            </wcs-card>
          ))}
        </div>
      </div>

      {/* Modal d'ajout d'agent */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
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
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>➕ Ajouter un agent</h3>
              <button 
                onClick={() => setShowAddModal(false)}
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
              <wcs-form-field>
                <wcs-label>Code Personnel</wcs-label>
                <wcs-input
                  value={newAgent.codePersonnel}
                  onInput={(e) => setNewAgent(prev => ({ ...prev, codePersonnel: e.target.value }))}
                  placeholder="1234567A"
                  maxLength={8}
                ></wcs-input>
                <div style={{ fontSize: '0.8em', color: '#666', marginTop: 4 }}>
                  Format: 7 chiffres + 1 lettre
                </div>
              </wcs-form-field>
              
              <wcs-form-field>
                <wcs-label>Nom</wcs-label>
                <wcs-input
                  value={newAgent.nom}
                  onInput={(e) => setNewAgent(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="DUPONT"
                ></wcs-input>
              </wcs-form-field>
              
              <wcs-form-field>
                <wcs-label>Prénom</wcs-label>
                <wcs-input
                  value={newAgent.prenom}
                  onInput={(e) => setNewAgent(prev => ({ ...prev, prenom: e.target.value }))}
                  placeholder="Jean"
                ></wcs-input>
              </wcs-form-field>
            </div>
            
            <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <wcs-button 
                color="secondary"
                onClick={() => setShowAddModal(false)}
              >
                Annuler
              </wcs-button>
              <wcs-button 
                color="primary"
                onClick={handleAddAgent}
              >
                Ajouter
              </wcs-button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de résultats d'upload */}
      {showUploadModal && uploadResults && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
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
            maxWidth: 600,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>📊 Résultats de l'import</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
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
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#0066cc' }}>{uploadResults.total}</div>
                  <div>Total</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#28a745' }}>{uploadResults.success}</div>
                  <div>Succès</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#dc3545' }}>{uploadResults.errors}</div>
                  <div>Erreurs</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#6c757d' }}>{uploadResults.ignored}</div>
                  <div>Ignorés</div>
                </div>
              </div>
            </div>
            
            {uploadResults.details && uploadResults.details.length > 0 && (
              <div>
                <h4>Détail des opérations</h4>
                <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                  {uploadResults.details.map((detail, index) => (
                    <div key={index} style={{
                      padding: '8px 12px',
                      marginBottom: '4px',
                      borderRadius: 4,
                      backgroundColor: detail.status === 'success' ? '#d4edda' : '#f8d7da',
                      color: detail.status === 'success' ? '#155724' : '#721c24',
                      fontSize: '0.9em'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>
                        Ligne {detail.line}: {detail.code} - {detail.prenom} {detail.nom}
                      </div>
                      <div>{detail.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <wcs-button 
                color="primary"
                onClick={() => setShowUploadModal(false)}
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