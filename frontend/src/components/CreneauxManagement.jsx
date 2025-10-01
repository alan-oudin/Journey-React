import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDelete, apiPut } from '../api';

export default function CreneauxManagement() {
  const [creneaux, setCreneaux] = useState({ matin: {}, 'apres-midi': {} });
  const [creneauxBloques, setCreneauxBloques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showBloquerModal, setShowBloquerModal] = useState(false);
  const [selectedCreneau, setSelectedCreneau] = useState(null);
  const [raisonBlocage, setRaisonBlocage] = useState('');
  const [showAjouterModal, setShowAjouterModal] = useState(false);
  const [nouveauCreneau, setNouveauCreneau] = useState({
    heure_creneau: '',
    periode: 'matin',
    capacite: 14
  });

  const showAlert = useCallback((message, type = 'info') => {
    const id = Date.now();
    const alert = { id, message, type };
    setAlerts(prev => [...prev, alert]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  }, []);

  const fetchCreneaux = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('creneaux');
      setCreneaux(data);
    } catch (error) {
      showAlert('Erreur lors du chargement des créneaux', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  const fetchCreneauxBloques = useCallback(async () => {
    try {
      const data = await apiGet('creneaux/bloquer');
      if (data.success) {
        setCreneauxBloques(data.creneaux_bloques || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux bloqués:', error);
    }
  }, []);

  const handleBloquerCreneau = (heureCreneau) => {
    setSelectedCreneau(heureCreneau);
    setRaisonBlocage('');
    setShowBloquerModal(true);
  };

  const confirmBloquerCreneau = async () => {
    if (!selectedCreneau) return;

    setLoading(true);
    try {
      const data = await apiPost('creneaux/bloquer', {
        heure_creneau: selectedCreneau,
        date_creneau: null,
        raison: raisonBlocage || null
      });

      if (data.success) {
        showAlert(`Créneau ${selectedCreneau} bloqué avec succès`, 'success');
        setShowBloquerModal(false);
        setSelectedCreneau(null);
        setRaisonBlocage('');
        fetchCreneaux();
        fetchCreneauxBloques();
      } else {
        showAlert(data.error || 'Erreur lors du blocage', 'error');
      }
    } catch (error) {
      showAlert('Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDebloquerCreneau = async (heureCreneau) => {
    if (!window.confirm(`Débloquer le créneau ${heureCreneau} ?`)) return;

    setLoading(true);
    try {
      const data = await apiDelete('creneaux/bloquer', { heure: heureCreneau });

      if (data.success) {
        showAlert(`Créneau ${heureCreneau} débloqué avec succès`, 'success');
        fetchCreneaux();
        fetchCreneauxBloques();
      } else {
        showAlert(data.error || 'Erreur lors du déblocage', 'error');
      }
    } catch (error) {
      showAlert('Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAjouterCreneau = () => {
    setNouveauCreneau({
      heure_creneau: '',
      periode: 'matin',
      capacite: 14
    });
    setShowAjouterModal(true);
  };

  const confirmAjouterCreneau = async () => {
    if (!nouveauCreneau.heure_creneau) {
      showAlert('Veuillez saisir une heure', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await apiPost('creneaux/config', nouveauCreneau);

      if (data.success) {
        showAlert(`Créneau ${nouveauCreneau.heure_creneau} ajouté avec succès`, 'success');
        setShowAjouterModal(false);
        fetchCreneaux();
      } else {
        showAlert(data.error || 'Erreur lors de l\'ajout', 'error');
      }
    } catch (error) {
      showAlert(error.message || 'Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSupprimerCreneau = async (heureCreneau) => {
    if (!window.confirm(`Supprimer définitivement le créneau ${heureCreneau} ?\n\nAttention: Cette action est irréversible et le créneau ne pourra plus être utilisé.`)) return;

    setLoading(true);
    try {
      const data = await apiDelete('creneaux/config', { heure: heureCreneau });

      if (data.success) {
        showAlert(`Créneau ${heureCreneau} supprimé avec succès`, 'success');
        fetchCreneaux();
      } else {
        showAlert(data.error || 'Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      showAlert(error.message || 'Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdminOnly = async (heureCreneau, currentValue) => {
    const newValue = !currentValue;
    const action = newValue ? 'réserver aux bénévoles' : 'rendre public';

    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} le créneau ${heureCreneau} ?`)) return;

    setLoading(true);
    try {
      const data = await apiPut('creneaux/config', { admin_only: newValue }, { heure: heureCreneau });

      if (data.success) {
        showAlert(`Créneau ${heureCreneau} ${newValue ? 'réservé aux bénévoles' : 'rendu public'}`, 'success');
        fetchCreneaux();
      } else {
        showAlert(data.error || 'Erreur lors de la modification', 'error');
      }
    } catch (error) {
      showAlert(error.message || 'Erreur de connexion au serveur', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreneaux();
    fetchCreneauxBloques();
  }, [fetchCreneaux, fetchCreneauxBloques]);

  const renderCreneauCard = (heure, data, periode) => {
    const isBloque = data.bloque || false;
    const isComplet = data.complet || false;
    const isAdminOnly = data.admin_only || false;

    return (
      <div
        key={heure}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          backgroundColor: isBloque ? '#fee' : (isComplet ? '#fef3cd' : '#f8f9fa'),
          borderRadius: '8px',
          border: `2px solid ${isBloque ? '#dc3545' : (isComplet ? '#ffc107' : '#e9ecef')}`,
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: 1, minWidth: '150px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.1em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {heure}
            {isAdminOnly && (
              <span style={{
                fontSize: '0.7em',
                backgroundColor: '#17a2b8',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '3px',
                fontWeight: 'bold'
              }}>
                👤 BÉNÉVOLES
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            {data.agents_inscrits} agents • {data.personnes_total} personnes
          </div>
          {data.places_restantes !== 999 && (
            <div style={{ fontSize: '0.85em', color: isComplet ? '#856404' : '#28a745', marginTop: '4px' }}>
              {data.places_restantes} places restantes
            </div>
          )}
          {data.places_restantes === 999 && (
            <div style={{ fontSize: '0.85em', color: '#17a2b8', marginTop: '4px' }}>
              Capacité illimitée
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {isBloque && (
            <>
              <span style={{
                fontSize: '0.85em',
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                🚫 BLOQUÉ
              </span>
              {data.raison_blocage && (
                <span style={{
                  fontSize: '0.8em',
                  color: '#666',
                  fontStyle: 'italic',
                  maxWidth: '200px',
                  textAlign: 'right'
                }}>
                  Raison: {data.raison_blocage}
                </span>
              )}
            </>
          )}

          {isComplet && !isBloque && (
            <span style={{
              fontSize: '0.85em',
              backgroundColor: '#ffc107',
              color: '#000',
              padding: '4px 8px',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}>
              ⚠️ COMPLET
            </span>
          )}

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <wcs-button
              color={isAdminOnly ? 'secondary' : 'info'}
              size="s"
              shape="outline"
              onClick={() => handleToggleAdminOnly(heure, isAdminOnly)}
              disabled={loading}
              title={isAdminOnly ? 'Cliquez pour rendre ce créneau public' : 'Cliquez pour réserver ce créneau aux bénévoles'}
            >
              {isAdminOnly ? '🔓 Public' : '🔒 Bénévoles'}
            </wcs-button>
            {isBloque ? (
              <wcs-button
                color="success"
                size="s"
                onClick={() => handleDebloquerCreneau(heure)}
                disabled={loading}
              >
                ✅ Débloquer
              </wcs-button>
            ) : (
              <wcs-button
                color="danger"
                size="s"
                onClick={() => handleBloquerCreneau(heure)}
                disabled={loading}
              >
                🚫 Bloquer
              </wcs-button>
            )}
            {data.agents_inscrits === 0 && (
              <wcs-button
                color="danger"
                size="s"
                shape="outline"
                onClick={() => handleSupprimerCreneau(heure)}
                disabled={loading}
              >
                🗑️ Supprimer
              </wcs-button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3>🕐 Gestion des créneaux horaires</h3>
          <p style={{ color: '#666', fontSize: '0.95em' }}>
            Gérez la disponibilité des créneaux horaires. Un créneau bloqué empêche les nouvelles inscriptions.
          </p>
        </div>
        <wcs-button
          color="primary"
          onClick={handleAjouterCreneau}
          disabled={loading}
        >
          ➕ Ajouter un créneau
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

      {loading && <wcs-spinner style={{ display: 'block', margin: '32px auto' }} />}

      {!loading && (
        <div style={{ display: 'grid', gap: '32px' }}>
          {/* Créneaux du matin */}
          <wcs-card style={{ padding: '20px' }}>
            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌅 Créneaux du matin (09h00 - 12h20)
            </h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {Object.entries(creneaux.matin || {}).map(([heure, data]) =>
                renderCreneauCard(heure, data, 'matin')
              )}
            </div>
          </wcs-card>

          {/* Créneaux de l'après-midi */}
          <wcs-card style={{ padding: '20px' }}>
            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌆 Créneaux de l'après-midi (13h00 - 15h00)
            </h4>
            <div style={{ display: 'grid', gap: '12px' }}>
              {Object.entries(creneaux['apres-midi'] || {}).map(([heure, data]) =>
                renderCreneauCard(heure, data, 'apres-midi')
              )}
            </div>
          </wcs-card>

          {/* Résumé des créneaux bloqués */}
          {creneauxBloques.length > 0 && (
            <wcs-card style={{ padding: '20px', backgroundColor: '#fff3cd' }}>
              <h4 style={{ marginBottom: '16px', color: '#856404' }}>
                📋 Créneaux actuellement bloqués ({creneauxBloques.length})
              </h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                {creneauxBloques.map(creneau => (
                  <div
                    key={creneau.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #ffc107'
                    }}
                  >
                    <div>
                      <strong>{creneau.heure_creneau}</strong>
                      {creneau.raison && (
                        <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
                          Raison: {creneau.raison}
                        </div>
                      )}
                      <div style={{ fontSize: '0.75em', color: '#999', marginTop: '4px' }}>
                        Bloqué par: {creneau.created_by} • {new Date(creneau.created_at).toLocaleString('fr-FR')}
                      </div>
                    </div>
                    <wcs-button
                      color="success"
                      size="s"
                      onClick={() => handleDebloquerCreneau(creneau.heure_creneau)}
                      disabled={loading}
                    >
                      Débloquer
                    </wcs-button>
                  </div>
                ))}
              </div>
            </wcs-card>
          )}
        </div>
      )}

      {/* Modal de blocage */}
      {showBloquerModal && (
        <wcs-modal show={true} size="m" onWcsDialogClosed={() => setShowBloquerModal(false)}>
          <span slot="header">🚫 Bloquer le créneau {selectedCreneau}</span>
          <span slot="content">
            <div style={{ padding: '20px' }}>
              <p style={{ marginBottom: '16px', color: '#666' }}>
                Vous êtes sur le point de bloquer le créneau <strong>{selectedCreneau}</strong>.
                Les nouvelles inscriptions seront impossibles pour ce créneau.
              </p>

              <wcs-form-field label="Raison du blocage (optionnel)" style={{ marginBottom: '16px' }}>
                <wcs-textarea
                  value={raisonBlocage}
                  onInput={(e) => setRaisonBlocage(e.target.value)}
                  placeholder="Ex: Maintenance, Capacité réduite, Événement spécial..."
                  rows="3"
                  maxlength="255"
                />
              </wcs-form-field>

              <div style={{
                padding: '12px',
                backgroundColor: '#fff3cd',
                borderRadius: '6px',
                border: '1px solid #ffc107',
                fontSize: '0.9em'
              }}>
                ⚠️ <strong>Note:</strong> Les agents déjà inscrits sur ce créneau ne seront pas affectés.
              </div>
            </div>
          </span>
          <span slot="actions">
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <wcs-button
                color="secondary"
                onClick={() => setShowBloquerModal(false)}
                disabled={loading}
              >
                Annuler
              </wcs-button>
              <wcs-button
                color="danger"
                onClick={confirmBloquerCreneau}
                disabled={loading}
              >
                {loading ? <wcs-spinner size="small" /> : 'Confirmer le blocage'}
              </wcs-button>
            </div>
          </span>
        </wcs-modal>
      )}

      {/* Modal d'ajout de créneau */}
      {showAjouterModal && (
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
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>➕ Ajouter un nouveau créneau</h2>
              <button
                onClick={() => setShowAjouterModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '20px' }}>
              <p style={{ marginBottom: '16px', color: '#666' }}>
                Créez un nouveau créneau horaire pour l'événement.
              </p>

              <wcs-form-field label="Heure du créneau *" style={{ marginBottom: '16px' }}>
                <wcs-input
                  type="time"
                  value={nouveauCreneau.heure_creneau}
                  onInput={(e) => setNouveauCreneau({ ...nouveauCreneau, heure_creneau: e.target.value })}
                  placeholder="HH:MM"
                  required
                />
              </wcs-form-field>

              <wcs-form-field label="Période *" style={{ marginBottom: '16px' }}>
                <wcs-select
                  value={nouveauCreneau.periode}
                  onWcsChange={(e) => setNouveauCreneau({ ...nouveauCreneau, periode: e.detail.value })}
                >
                  <wcs-select-option value="matin">Matin</wcs-select-option>
                  <wcs-select-option value="apres-midi">Après-midi</wcs-select-option>
                </wcs-select>
              </wcs-form-field>

              <wcs-form-field label="Capacité maximale *" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', gap: '12px' }}>
                  <wcs-input
                    type="number"
                    value={nouveauCreneau.capacite}
                    onInput={(e) => setNouveauCreneau({ ...nouveauCreneau, capacite: parseInt(e.target.value) || 14 })}
                    min="1"
                    max="999"
                    placeholder="14"
                    required
                    style={{ maxWidth: '150px' }}
                  />
                  <div style={{ fontSize: '0.85em', color: '#666' }}>
                    Saisissez 999 pour une capacité illimitée
                  </div>
                </div>
              </wcs-form-field>

              <div style={{
                padding: '12px',
                backgroundColor: '#d1ecf1',
                borderRadius: '6px',
                border: '1px solid #bee5eb',
                fontSize: '0.9em'
              }}>
                ℹ️ <strong>Conseil:</strong> Assurez-vous que l'heure saisie n'existe pas déjà dans la liste des créneaux.
              </div>
            </div>

            {/* Actions */}
            <div style={{
              padding: '20px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <wcs-button
                color="secondary"
                onClick={() => setShowAjouterModal(false)}
                disabled={loading}
              >
                Annuler
              </wcs-button>
              <wcs-button
                color="primary"
                onClick={confirmAjouterCreneau}
                disabled={loading || !nouveauCreneau.heure_creneau}
              >
                {loading ? <wcs-spinner size="small" /> : 'Ajouter le créneau'}
              </wcs-button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}