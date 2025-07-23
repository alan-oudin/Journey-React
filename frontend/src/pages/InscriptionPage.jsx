import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiPost, apiGet } from '../api';

export default function InscriptionPage() {
  const [form, setForm] = useState({
    codePersonnel: '',
    nom: '',
    prenom: '',
    email: '',
    nombreProches: '',
    heureArrivee: ''
  });
  const [loading, setLoading] = useState(false);
  const [creneaux, setCreneaux] = useState({ matin: {}, 'apres-midi': {} });
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);
  const [fieldAlerts, setFieldAlerts] = useState({});
  const selectRef = useRef(null);
  const timeoutRefs = useRef({});

  // Fonction pour fermer manuellement une alerte
  const closeAlert = useCallback((field) => {
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
  }, []);

  const handleWcsSelectChange = useCallback((e) => {
    const value = e.detail.value;
    
    // Nettoyer l'alerte WCS du select
    if (fieldAlerts.nombreProches) {
      closeAlert('nombreProches');
    }
    
    setForm(f => {
      const newForm = { ...f, nombreProches: value };
      
      // Si on change le nombre de proches, réinitialiser la sélection de créneau
      // si le créneau actuel devient insuffisant
      if (f.heureArrivee && value !== '') {
        const periode = f.heureArrivee >= '13:00' ? 'apres-midi' : 'matin';
        const info = creneaux[periode][f.heureArrivee];
        if (info) {
          const personnesAInscrire = parseInt(value) + 1;
          if (info.places_restantes < personnesAInscrire) {
            newForm.heureArrivee = '';
          }
        }
      }
      
      return newForm;
    });
  }, [fieldAlerts.nombreProches, closeAlert, creneaux]);

  useEffect(() => {
    setLoadingCreneaux(true);
    apiGet('creneaux')
      .then(data => setCreneaux(data))
      .catch(() => setCreneaux({ matin: {}, 'apres-midi': {} }))
      .finally(() => setLoadingCreneaux(false));
  }, []);

  useEffect(() => {
    const selectElement = selectRef.current;
    if (selectElement) {
      const handleWcsChangeEvent = (event) => {
        handleWcsSelectChange(event);
      };
      
      selectElement.addEventListener('wcsChange', handleWcsChangeEvent);
      
      return () => {
        selectElement.removeEventListener('wcsChange', handleWcsChangeEvent);
      };
    }
  }, [handleWcsSelectChange]);

  // Cleanup des timeouts lors du démontage du composant
  useEffect(() => {
    return () => {
      const currentTimeouts = timeoutRefs.current;
      Object.values(currentTimeouts).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    };
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    
    // Nettoyer les alertes WCS en cours de modification
    if (fieldAlerts[name]) {
      closeAlert(name);
    }
    
    setForm(f => {
      const newForm = { ...f, [name]: value };
      
      // Si on change le nombre de proches, réinitialiser la sélection de créneau
      // si le créneau actuel devient insuffisant
      if (name === 'nombreProches' && f.heureArrivee && value !== '') {
        const periode = f.heureArrivee >= '13:00' ? 'apres-midi' : 'matin';
        const info = creneaux[periode][f.heureArrivee];
        if (info) {
          const personnesAInscrire = parseInt(value) + 1;
          if (info.places_restantes < personnesAInscrire) {
            newForm.heureArrivee = '';
          }
        }
      }
      
      return newForm;
    });
  };

  const handleCheckboxChange = (heure) => {
    // Si la checkbox est déjà cochée, on la décoche
    if (form.heureArrivee === heure) {
      setForm(f => ({ ...f, heureArrivee: '' }));
    } else {
      // Sinon, on sélectionne ce créneau (et cela décoche automatiquement les autres)
      setForm(f => ({ ...f, heureArrivee: heure }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Validation du code personnel
    if (!form.codePersonnel) {
      newErrors.codePersonnel = "Le code personnel est obligatoire.";
    } else if (!form.codePersonnel.match(/^[0-9]{7}[A-Za-z]{1}$/)) {
      newErrors.codePersonnel = "Le code personnel doit comporter exactement 7 chiffres suivis d'une lettre (ex: 1234567A).";
    }
    
    // Validation du nom
    if (!form.nom) {
      newErrors.nom = "Le nom est obligatoire.";
    } else if (form.nom.length < 2) {
      newErrors.nom = "Le nom doit contenir au moins 2 caractères.";
    }
    
    // Validation du prénom
    if (!form.prenom) {
      newErrors.prenom = "Le prénom est obligatoire.";
    } else if (form.prenom.length < 2) {
      newErrors.prenom = "Le prénom doit contenir au moins 2 caractères.";
    }
    
    // Validation du nombre de proches
    if (form.nombreProches === '') {
      newErrors.nombreProches = "Veuillez sélectionner le nombre de proches accompagnants.";
    }
    
    // Validation du créneau
    if (!form.heureArrivee) {
      newErrors.heureArrivee = "Veuillez choisir un créneau d'arrivée.";
    } else if (form.nombreProches !== '') {
      // Vérifier si le créneau sélectionné a assez de places
      const periode = form.heureArrivee >= '13:00' ? 'apres-midi' : 'matin';
      const info = creneaux[periode][form.heureArrivee];
      if (info) {
        const personnesAInscrire = parseInt(form.nombreProches) + 1;
        if (info.places_restantes < personnesAInscrire) {
          newErrors.heureArrivee = `Places insuffisantes sur ce créneau. Il reste ${info.places_restantes} places, mais vous avez besoin de ${personnesAInscrire} places.`;
        }
      }
    }
    
    return newErrors;
  };

  const peutInscrire = (info) => {
    if (!form.nombreProches && form.nombreProches !== '0') return true;
    const personnesAInscrire = parseInt(form.nombreProches) + 1;
    return info.places_restantes >= personnesAInscrire;
  };

  // Fonction pour gérer les timeouts automatiques des alertes
  const setAlertWithTimeout = (field, alertData, timeout = 5000) => {
    // Annuler le timeout précédent pour ce champ s'il existe
    if (timeoutRefs.current[field]) {
      clearTimeout(timeoutRefs.current[field]);
    }
    
    // Mettre à jour l'alerte
    setFieldAlerts(prev => ({
      ...prev,
      [field]: alertData
    }));
    
    // Programmer la suppression automatique
    timeoutRefs.current[field] = setTimeout(() => {
      setFieldAlerts(prev => {
        const newAlerts = {...prev};
        delete newAlerts[field];
        return newAlerts;
      });
      delete timeoutRefs.current[field];
    }, timeout);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const newErrors = validate();
    
    // Convertir les erreurs en format { message, type } pour WCS alerts
    const formattedErrors = {};
    Object.keys(newErrors).forEach(field => {
      formattedErrors[field] = {
        message: newErrors[field],
        type: 'error'
      };
    });
    setFieldAlerts(formattedErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    setLoading(true);
    try {
      await apiPost('agents', {
        code_personnel: form.codePersonnel,
        nom: form.nom,
        prenom: form.prenom,
        nombre_proches: Number(form.nombreProches),
        heure_arrivee: form.heureArrivee
      });
      
      // Afficher un message de succès via une alerte WCS
      setAlertWithTimeout('success', {
        message: 'Inscription réussie !',
        type: 'success'
      }, 6000);
      setForm({ codePersonnel: '', nom: '', prenom: '', email: '', nombreProches: '', heureArrivee: '' });
    } catch (e) {
      const msg = (e.message || '').toLowerCase();
      
      // Gestion spécifique des erreurs selon le type
      if ((msg.includes('agent') && (msg.includes('déjà inscrit') || msg.includes('deja inscrit') || msg.includes('existe'))) || msg.includes('code personnel')) {
        const errorMessage = "Ce code personnel est déjà utilisé. Chaque agent ne peut s'inscrire qu'une seule fois.";
        
        setAlertWithTimeout('codePersonnel', {
          message: errorMessage,
          type: 'error'
        }, 8000); // 8 secondes pour les erreurs importantes
      } else if (msg.includes('capacité') || msg.includes('complet') || msg.includes('dépassée')) {
        const errorMessage = "Le créneau sélectionné est complet. Veuillez choisir un autre créneau.";
        
        setAlertWithTimeout('heureArrivee', {
          message: errorMessage,
          type: 'error'
        }, 8000); // 8 secondes pour les erreurs importantes
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setAlertWithTimeout('network', {
          message: "Erreur de connexion au serveur. Vérifiez que WAMP est démarré et réessayez.",
          type: 'error'
        }, 10000);
      } else if (msg.includes('500')) {
        setAlertWithTimeout('server', {
          message: "Erreur du serveur. Vérifiez la base de données et les logs du serveur.",
          type: 'error'
        }, 10000);
      } else {
        setAlertWithTimeout('general', {
          message: `Erreur lors de l'inscription : ${e.message}`,
          type: 'error'
        }, 10000);
      }
    } finally {
      setLoading(false);
    }
  };

  const creneauxMatin = [
    '09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00', '11:20', '11:40'
  ];
  const creneauxApresMidi = [
    '13:00', '13:20', '13:40', '14:00', '14:20', '14:40', '15:00', '15:20', '15:40'
  ];

  return (
    <div className="gestion-container" style={{padding: '40px 20px'}}>
      <h2>📝 Inscription d'un agent</h2>
      <p>Journée des Proches - Système d'inscription en amont</p>

      {/* Alertes WCS */}
      {Object.keys(fieldAlerts).map(field => (
        <wcs-alert 
          key={field} 
          intent={fieldAlerts[field].type === 'success' ? 'success' : 'error'} 
          show 
          style={{
            marginBottom: 16,
            ...(fieldAlerts[field].type === 'success' && {
              borderLeft: '4px solid #28a745',
              backgroundColor: '#d4edda'
            })
          }}
        >
          <span slot="title">
            {fieldAlerts[field].type === 'success' ? '✅ ' : '❌ '}
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

      {loading && (
        <wcs-spinner style={{ display: 'block', margin: '16px auto' }}></wcs-spinner>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-columns">
          <div className="form-left">
            <wcs-form-field>
              <wcs-label required>Code Personnel (CP)</wcs-label>
              <wcs-input
                name="codePersonnel"
                value={form.codePersonnel}
                onInput={handleChange}
                type="text"
                required
                pattern="[0-9]{7}[A-Za-z]{1}"
                placeholder="Ex: 1234567A"
                maxLength={8}
                disabled={loading}
                aria-describedby="hint-cp"
              ></wcs-input>
              <wcs-hint id="hint-cp">7 chiffres suivis d'une lettre</wcs-hint>
            </wcs-form-field>
            <wcs-form-field>
              <wcs-label required>Nom</wcs-label>
              <wcs-input
                name="nom"
                value={form.nom}
                onInput={handleChange}
                type="text"
                required
                placeholder="Nom de famille"
                disabled={loading}
                aria-describedby="hint-nom"
              ></wcs-input>
              <wcs-hint id="hint-nom">Nom de famille de l'agent</wcs-hint>
            </wcs-form-field>
            <wcs-form-field>
              <wcs-label required>Prénom</wcs-label>
              <wcs-input
                name="prenom"
                value={form.prenom}
                onInput={handleChange}
                type="text"
                required
                placeholder="Prénom"
                disabled={loading}
                aria-describedby="hint-prenom"
              ></wcs-input>
              <wcs-hint id="hint-prenom">Prénom de l'agent</wcs-hint>
            </wcs-form-field>
            <wcs-form-field>
              <wcs-label required>Nombre de proches accompagnants</wcs-label>
              <wcs-select
                ref={selectRef}
                name="nombreProches"
                value={form.nombreProches}
                onWcsChange={handleWcsSelectChange}
                placeholder="Sélectionner le nombre"
                required
                disabled={loading}
                aria-describedby="hint-nbproches"
                style={{ width: '100%' }}
              >
                <wcs-select-option value="0">0 proche (agent seul)</wcs-select-option>
                <wcs-select-option value="1">1 proche</wcs-select-option>
                <wcs-select-option value="2">2 proches</wcs-select-option>
                <wcs-select-option value="3">3 proches</wcs-select-option>
                <wcs-select-option value="4">4 proches (maximum autorisé)</wcs-select-option>
              </wcs-select>
              <wcs-hint id="hint-nbproches">Nombre de proches maximum autorisé : 4</wcs-hint>
            </wcs-form-field>
          </div>
          <div className="form-separator"></div>
          <div className="form-right">
            <wcs-form-field style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <wcs-label required>Heure d'arrivée souhaitée</wcs-label>
              {loadingCreneaux ? (
                <div>Chargement des créneaux...</div>
              ) : (
                <div>
                  <div style={{marginBottom: 20}}><strong>🌅 Matin (9h00 - 11h40)</strong></div>
                  <div className="creneaux-grid">
                    {creneauxMatin.map(heure => {
                      const info = creneaux.matin[heure] || { personnes_total: 0, places_restantes: 14, complet: false };
                      const disabled = loading || info.complet || !peutInscrire(info);
                      return (
                        <wcs-card key={heure} style={{ minWidth: 160, maxWidth: 180, margin: 0, padding: 12, opacity: disabled ? 0.5 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer', border: form.heureArrivee === heure ? '2px solid #0074D9' : '1px solid #ccc' }} onClick={() => !disabled && handleCheckboxChange(heure)}>
                          <div style={{ fontWeight: 'bold', fontSize: 18 }}>{heure}</div>
                          <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span>{info.places_restantes} places</span>
                            {info.complet && <wcs-badge color="danger">Complet</wcs-badge>}
                            {!info.complet && !peutInscrire(info) && form.nombreProches !== '' && <wcs-badge color="danger">Insuffisant</wcs-badge>}
                            {!info.complet && peutInscrire(info) && info.places_restantes <= 3 && <wcs-badge color="warning">⚡ Limité</wcs-badge>}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            {form.heureArrivee === heure && (
                              <wcs-mat-icon icon="check_circle" color="primary" size="m"></wcs-mat-icon>
                            )}
                            {form.heureArrivee !== heure && (
                              <wcs-mat-icon icon="radio_button_unchecked" color="gray" size="m"></wcs-mat-icon>
                            )}
                          </div>
                        </wcs-card>
                      );
                    })}
                  </div>
                  <div style={{marginBottom: 20}}><strong>🌆 Après-midi (13h00 - 15h40)</strong></div>
                  <div className="creneaux-grid">
                    {creneauxApresMidi.map(heure => {
                      const info = creneaux['apres-midi'][heure] || { personnes_total: 0, places_restantes: 14, complet: false };
                      const disabled = loading || info.complet || !peutInscrire(info);
                      return (
                        <wcs-card key={heure} style={{ minWidth: 160, maxWidth: 180, margin: 0, padding: 12, opacity: disabled ? 0.5 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer', border: form.heureArrivee === heure ? '2px solid #0074D9' : '1px solid #ccc' }} onClick={() => !disabled && handleCheckboxChange(heure)}>
                          <div style={{ fontWeight: 'bold', fontSize: 18 }}>{heure}</div>
                          <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span>{info.places_restantes} places</span>
                            {info.complet && <wcs-badge color="danger">Complet</wcs-badge>}
                            {!info.complet && !peutInscrire(info) && form.nombreProches !== '' && <wcs-badge color="danger">Insuffisant</wcs-badge>}
                            {!info.complet && peutInscrire(info) && info.places_restantes <= 3 && <wcs-badge color="warning">⚡ Limité</wcs-badge>}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            {form.heureArrivee === heure && (
                              <wcs-mat-icon icon="check_circle" color="primary" size="m"></wcs-mat-icon>
                            )}
                            {form.heureArrivee !== heure && (
                              <wcs-mat-icon icon="radio_button_unchecked" color="gray" size="m"></wcs-mat-icon>
                            )}
                          </div>
                        </wcs-card>
                      );
                    })}
                  </div>
                </div>
              )}
              <wcs-hint>Choisissez un créneau disponible</wcs-hint>
            </wcs-form-field>
          </div>
        </div>
        <wcs-button type="submit" color="primary" shape="block" disabled={loading} style={{marginTop: 100,width: '100%'}}>
          {loading ? <wcs-spinner size="small"></wcs-spinner> : "S'inscrire"}
        </wcs-button>
      </form>
    </div>
  );
} 