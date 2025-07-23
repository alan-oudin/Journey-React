import React, {useState} from 'react';
import {apiGet} from '../api';

export default function RecherchePage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [agentTrouve, setAgentTrouve] = useState(null);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [noteMode, setNoteMode] = useState('add'); // 'add', 'edit', 'view'

    const handleSearch = async value => {
        setSearchTerm(value);
        setAgentTrouve(null);
        setError('');
        const regexCP = /^\d{7}[A-Z]$/;
        if (!value || !regexCP.test(value)) return;
        setLoading(true);
        try {
            const agent = await apiGet('search', {q: value});
            setAgentTrouve(agent);
        } catch (e) {
            setAgentTrouve(null);
            setError("L'agent n'est pas inscrit");
        } finally {
            setLoading(false);
        }
    };

    const handleChangeStatut = async (nouveauStatut) => {
        if (!agentTrouve) return;
        
        setActionLoading(true);
        try {
            const url = new URL('http://localhost:8080/journeyV2/backend/public/api.php');
            url.searchParams.append('path', 'agents');
            url.searchParams.append('code', agentTrouve.code_personnel);
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statut: nouveauStatut })
            });
            const data = await response.json();
            
            if (data.success) {
                setAgentTrouve(prev => ({ ...prev, statut: nouveauStatut }));
                setError('');
            } else {
                setError(data.error || 'Erreur lors de la modification du statut');
            }
        } catch (e) {
            setError('Erreur de connexion au serveur');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAjouterNote = () => {
        setNoteMode('add');
        setShowNoteModal(true);
        setNoteText('');
    };

    const handleVoirNote = () => {
        setNoteMode('view');
        setShowNoteModal(true);
        setNoteText(agentTrouve?.note || '');
    };

    const handleModifierNote = () => {
        setNoteMode('edit');
        setShowNoteModal(true);
        setNoteText(agentTrouve?.note || '');
    };

    const handleSupprimerNote = async () => {
        if (!window.confirm('Supprimer la note de cet agent ?')) return;
        
        setActionLoading(true);
        try {
            const url = new URL('http://localhost:8080/journeyV2/backend/public/api.php');
            url.searchParams.append('path', 'agents');
            url.searchParams.append('code', agentTrouve.code_personnel);
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: null })
            });
            const data = await response.json();
            
            if (data.success) {
                setAgentTrouve(prev => ({ ...prev, note: null }));
                setError('');
            } else {
                setError(data.error || 'Erreur lors de la suppression de la note');
            }
        } catch (e) {
            setError('Erreur de connexion au serveur');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSauvegarderNote = async () => {
        if (!agentTrouve || !noteText.trim()) {
            setShowNoteModal(false);
            return;
        }
        
        setActionLoading(true);
        try {
            const url = new URL('http://localhost:8080/journeyV2/backend/public/api.php');
            url.searchParams.append('path', 'agents');
            url.searchParams.append('code', agentTrouve.code_personnel);
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: noteText.trim() })
            });
            const data = await response.json();
            
            if (data.success) {
                setAgentTrouve(prev => ({ ...prev, note: noteText.trim() }));
                setShowNoteModal(false);
                setError('');
            } else {
                setError(data.error || 'Erreur lors de la sauvegarde de la note');
            }
        } catch (e) {
            setError('Erreur de connexion au serveur');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="gestion-container" style={{padding: '40px 20px',margin: '0 auto'}}>
            <h2>🔍 Recherche & Pointage - Jour J</h2>
            <p>Interface de recherche rapide et gestion des présences</p>

            {error && (
                <wcs-alert color="danger" show>
                    {error}
                    <wcs-button slot="action" shape="clear" onClick={() => setError('')}>Fermer</wcs-button>
                </wcs-alert>
            )}

            <wcs-form-field label="Code personnel (CP)">
                <wcs-input
                    value={searchTerm}
                    onInput={e => handleSearch(e.target.value)}
                    type="text"
                    placeholder="Tapez le code personnel (CP) de l'agent..."
                    icon="search"
                    required
                    disabled={loading}
                ></wcs-input>
            </wcs-form-field>

            {loading && <wcs-spinner style={{display: 'block', margin: '16px auto'}}></wcs-spinner>}

            {agentTrouve && (
                <div className="agent-found">
                    <wcs-card style={{marginTop: 15}}>
                        <wsc-card-body style={{margin: 10}}>
                            <wsc-card-header>
                                <span>✅ Agent trouvé !</span>

                            </wsc-card-header>
                            <wcs-divider style={{margin: '8px 0 8px 0'}}></wcs-divider>
                            <wsc-card-content>
                                <div style={{marginBottom: '20px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
                                    <div style={{fontSize: '1.2em', fontWeight: 'bold', marginBottom: '8px'}}>
                                        {agentTrouve.prenom} {agentTrouve.nom}
                                    </div>
                                    <div style={{color: '#666', fontFamily: 'monospace'}}>
                                        Code Personnel: {agentTrouve.code_personnel}
                                    </div>
                                </div>

                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px'}}>
                                    <div style={{padding: '12px', border: '1px solid #e0e0e0', borderRadius: '6px'}}>
                                        <div style={{fontWeight: 'bold', marginBottom: '4px'}}>👥 Participants</div>
                                        <div>{parseInt(agentTrouve.nombre_proches) + 1} personne{parseInt(agentTrouve.nombre_proches) + 1 > 1 ? 's' : ''}</div>
                                        <div style={{fontSize: '0.9em', color: '#666'}}>
                                            Agent + {agentTrouve.nombre_proches} proche{agentTrouve.nombre_proches > 1 ? 's' : ''}
                                        </div>
                                    </div>

                                    <div style={{padding: '12px', border: '1px solid #e0e0e0', borderRadius: '6px'}}>
                                        <div style={{fontWeight: 'bold', marginBottom: '4px'}}>⏰ Créneau</div>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                            <span>{agentTrouve.heure_arrivee < '12:00' ? '🌅' : '🌆'}</span>
                                            <span>{agentTrouve.heure_arrivee}</span>
                                        </div>
                                        <div style={{fontSize: '0.9em', color: '#666'}}>
                                            {agentTrouve.heure_arrivee < '12:00' ? 'Matin (9h-11h40)' : 'Après-midi (13h-15h40)'}
                                        </div>
                                    </div>

                                    <div style={{padding: '12px', border: '1px solid #e0e0e0', borderRadius: '6px'}}>
                                        <div style={{fontWeight: 'bold', marginBottom: ' 4px'}}>🍽️ Restauration</div>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                            {agentTrouve.restauration_sur_place === 1 || agentTrouve.restauration_sur_place === true ? (
                                                <>
                                                    <span style={{color: '#28a745', fontSize: '1.2em'}}>✅</span>
                                                    <span style={{color: '#28a745', fontWeight: 'bold'}}>Oui</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span style={{color: '#6c757d', fontSize: '1.2em'}}>❌</span>
                                                    <span style={{color: '#6c757d'}}>Non</span>
                                                </>
                                            )}
                                        </div>
                                        <div style={{fontSize: '0.9em', color: '#666'}}>
                                            {agentTrouve.restauration_sur_place === 1 || agentTrouve.restauration_sur_place === true ? 
                                                'Intéressé(e) par la restauration sur place' : 
                                                'Pas intéressé(e) par la restauration'
                                            }
                                        </div>
                                    </div>

                                    <div style={{padding: '12px', border: '1px solid #e0e0e0', borderRadius: '6px'}}>
                                        <div style={{fontWeight: 'bold', marginBottom: '4px'}}>📋 Statut</div>
                                        <div>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: 4,
                                                fontSize: '0.9em',
                                                fontWeight: 500,
                                                backgroundColor: 
                                                    agentTrouve.statut === 'present' ? '#d4edda' :
                                                    agentTrouve.statut === 'inscrit' ? '#d1ecf1' :
                                                    agentTrouve.statut === 'absent' ? '#fff3cd' :
                                                    agentTrouve.statut === 'annule' ? '#f8d7da' : '#e2e3e5',
                                                color:
                                                    agentTrouve.statut === 'present' ? '#155724' :
                                                    agentTrouve.statut === 'inscrit' ? '#0c5460' :
                                                    agentTrouve.statut === 'absent' ? '#856404' :
                                                    agentTrouve.statut === 'annule' ? '#721c24' : '#383d41'
                                            }}>
                                                {agentTrouve.statut === 'present' ? '✅ Présent' :
                                                 agentTrouve.statut === 'inscrit' ? '📝 Inscrit' :
                                                 agentTrouve.statut === 'absent' ? '❌ Absent' :
                                                 agentTrouve.statut === 'annule' ? '🚫 Annulé' : agentTrouve.statut}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{padding: '12px', border: '1px solid #e0e0e0', borderRadius: '6px'}}>
                                        <div style={{fontWeight: 'bold', marginBottom: '4px'}}>📅 Inscription</div>
                                        <div style={{fontSize: '0.9em'}}>
                                            {agentTrouve.date_inscription ? 
                                                new Date(agentTrouve.date_inscription).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                }) : 'Non renseignée'}
                                        </div>
                                        <div style={{fontSize: '0.8em', color: '#666'}}>
                                            {agentTrouve.date_inscription ? 
                                                new Date(agentTrouve.date_inscription).toLocaleTimeString('fr-FR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Prévisualisation de la note */}
                                {agentTrouve.note && (
                                    <div style={{
                                        marginTop: '20px', 
                                        padding: '12px', 
                                        backgroundColor: '#f8f9fa', 
                                        borderRadius: '6px', 
                                        border: '1px solid #e9ecef'
                                    }}>
                                        <div style={{fontWeight: 'bold', marginBottom: '8px', color: '#495057'}}>
                                            📝 Note
                                        </div>
                                        <div style={{
                                            fontSize: '0.9em', 
                                            lineHeight: '1.4',
                                            whiteSpace: 'pre-wrap',
                                            maxHeight: '80px',
                                            overflow: 'hidden',
                                            position: 'relative'
                                        }}>
                                            {agentTrouve.note.length > 150 ? 
                                                agentTrouve.note.substring(0, 150) + '...' : 
                                                agentTrouve.note
                                            }
                                        </div>
                                        {agentTrouve.note.length > 150 && (
                                            <div style={{fontSize: '0.8em', color: '#6c757d', marginTop: '4px'}}>
                                                Cliquez sur "Gérer note" pour voir le texte complet
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions rapides pour le jour J */}
                                <div style={{marginTop: '20px', padding: '16px', backgroundColor: '#f0f8ff', borderRadius: '8px', border: '1px solid #b3d9ff'}}>
                                    <div style={{fontWeight: 'bold', marginBottom: '12px', color: '#0066cc'}}>
                                        🎯 Actions rapides - Jour J
                                    </div>
                                    <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                                        <wcs-button 
                                            color="success" 
                                            size="s"
                                            disabled={agentTrouve.statut === 'present' || actionLoading}
                                            onClick={() => handleChangeStatut('present')}
                                        >
                                            {actionLoading ? <wcs-spinner size="small"></wcs-spinner> : '✅ Marquer présent'}
                                        </wcs-button>
                                        <wcs-button 
                                            color="warning" 
                                            size="s"
                                            disabled={agentTrouve.statut === 'absent' || actionLoading}
                                            onClick={() => handleChangeStatut('absent')}
                                        >
                                            {actionLoading ? <wcs-spinner size="small"></wcs-spinner> : '❌ Marquer absent'}
                                        </wcs-button>
                                        {!agentTrouve.note ? (
                                            <wcs-button 
                                                color="secondary" 
                                                size="s"
                                                disabled={actionLoading}
                                                onClick={handleAjouterNote}
                                            >
                                                📝 Ajouter note
                                            </wcs-button>
                                        ) : (
                                            <wcs-button 
                                                color="info" 
                                                size="s"
                                                disabled={actionLoading}
                                                onClick={handleVoirNote}
                                            >
                                                📋 Gérer note
                                            </wcs-button>
                                        )}
                                    </div>
                                </div>
                            </wsc-card-content>
                        </wsc-card-body>
                    </wcs-card>
                </div>
            )}

            {/* Modal pour ajouter une note */}
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
                            <strong>Agent :</strong> {agentTrouve?.prenom} {agentTrouve?.nom} ({agentTrouve?.code_personnel})
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
                                        onClick={handleModifierNote}
                                        disabled={actionLoading}
                                    >
                                        ✏️ Modifier
                                    </wcs-button>
                                    <wcs-button 
                                        color="danger"
                                        size="s"
                                        onClick={() => {
                                            setShowNoteModal(false);
                                            handleSupprimerNote();
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