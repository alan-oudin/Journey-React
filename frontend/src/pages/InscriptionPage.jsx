import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiPost, apiGet } from '../api';
import { useAlertDrawer } from '../contexts/AlertContext.tsx';
import { MaterialIconWithFallback } from '../utils/iconFallback';
import SecurityRulesModal from '../components/SecurityRulesModal';
import { useSecurityRulesAcceptance } from '../hooks/useSecurityRulesAcceptance';
import { downloadReservationPDF } from '../utils/pdfGenerator';
import { useNavigate } from 'react-router-dom';
import { EVENT_CONFIG } from '../constants/event';

// Hook d'authentification simple pour vérifier si on est admin
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuthentication = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await apiGet('verify-token');

      if (data.valid) {
        setIsAuthenticated(true);
        setUser({
          username: data.username,
          role: data.role
        });
      } else {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Erreur vérification token:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAuthentication();

    // Écouter les changements d'état d'authentification (déconnexion)
    const handleAuthChange = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // Si plus de token, rediriger vers l'accueil immédiatement
        navigate('/');
        window.location.reload();
      } else {
        checkAuthentication();
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, [checkAuthentication]);

  return { isAuthenticated, user, isLoading, checkAuthentication };
}

export default function InscriptionPage() {
  const { showAlert } = useAlertDrawer();
  const { hasAcceptedRules, isLoading: rulesLoading, acceptRules } = useSecurityRulesAcceptance();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  // Vérifier si l'utilisateur est admin
  const isAdmin = isAuthenticated && user && user.role;
  const [lastRegistrationData, setLastRegistrationData] = useState(null);
  const [form, setForm] = useState({
    codePersonnel: '',
    nom: '',
    prenom: '',
    nombreProches: '',
    heureArrivee: '',
    restaurationSurPlace: false
  });
  const [loading, setLoading] = useState(false);
  const [creneauxData, setCreneauxData] = useState({});
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);
  const [creneauxMatin, setCreneauxMatin] = useState([]);
  const [creneauxApresMidi, setCreneauxApresMidi] = useState([]);
  // const [isAuthenticated, setIsAuthenticated] = useState(false); // Non utilisé actuellement
  // const [showInfoAlert, setShowInfoAlert] = useState(true); // Non utilisé actuellement
  const selectRef = useRef(null);
  const checkboxRef = useRef(null);


  const handleWcsSelectChange = useCallback((e) => {
    const value = e.detail.value;
    
    setForm(f => {
      const newForm = { ...f, nombreProches: value };
      
      // Si on change le nombre de proches, réinitialiser la sélection de créneau
      // si le créneau actuel devient insuffisant
      if (f.heureArrivee && value !== '') {
        const info = creneauxData[f.heureArrivee];
        if (info) {
          const personnesAInscrire = parseInt(value) + 1;
          if (info.places_restantes < personnesAInscrire) {
            newForm.heureArrivee = '';
          }
        }
      }
      
      return newForm;
    });
  }, [creneauxData]);

  const handleWcsCheckboxChange = useCallback((e) => {
    const checked = e.detail?.checked ?? e.target?.checked ?? false;
    setForm(f => ({ ...f, restaurationSurPlace: checked }));
  }, []);

  useEffect(() => {
    setLoadingCreneaux(true);
    apiGet('creneaux')
      .then(data => {
        // Convertir la structure matin/après-midi vers une structure plate
        const flatData = {};
        Object.keys(data.matin || {}).forEach(heure => {
          flatData[heure] = data.matin[heure];
        });
        Object.keys(data['apres-midi'] || {}).forEach(heure => {
          flatData[heure] = data['apres-midi'][heure];
        });
        setCreneauxData(flatData);

        // Extraire les listes de créneaux depuis l'API
        setCreneauxMatin(Object.keys(data.matin || {}).sort());
        setCreneauxApresMidi(Object.keys(data['apres-midi'] || {}).sort());
      })
      .catch(() => {
        setCreneauxData({});
        // En cas d'erreur, utiliser les créneaux par défaut
        setCreneauxMatin([
          '09:00', '09:20', '09:40', '10:00', '10:20', '10:40',
          '11:00', '11:20', '11:40', '12:00', '12:20'
        ]);
        setCreneauxApresMidi([
          '13:00', '13:20', '13:40', '14:00', '14:20', '14:40', '15:00'
        ]);
      })
      .finally(() => setLoadingCreneaux(false));

    // Code pour vérifier l'authentification supprimé car non utilisé
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

  useEffect(() => {
    const checkboxElement = checkboxRef.current;
    if (checkboxElement) {
      const handleWcsChangeEvent = (event) => {
        handleWcsCheckboxChange(event);
      };
      
      checkboxElement.addEventListener('wcsChange', handleWcsChangeEvent);
      
      return () => {
        checkboxElement.removeEventListener('wcsChange', handleWcsChangeEvent);
      };
    }
  }, [handleWcsCheckboxChange]);

  // Synchroniser la checkbox WCS avec l'état React
  useEffect(() => {
    const checkboxElement = checkboxRef.current;
    if (checkboxElement) {
      checkboxElement.checked = form.restaurationSurPlace;
    }
  }, [form.restaurationSurPlace]);


  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setForm(f => {
      const newForm = { ...f, [name]: newValue };
      
      // Si on change le nombre de proches, réinitialiser la sélection de créneau
      // si le créneau actuel devient insuffisant
      if (name === 'nombreProches' && f.heureArrivee && value !== '') {
        const info = creneauxData[f.heureArrivee];
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
      const info = creneauxData[form.heureArrivee];
      if (info) {
        const personnesAInscrire = parseInt(form.nombreProches) + 1;
        if (info.places_restantes < personnesAInscrire) {
          newErrors.heureArrivee = `Places insuffisantes sur ce créneau. Il reste ${info.places_restantes} places, mais vous avez besoin de ${personnesAInscrire} places.`;
        }
      }
    }
    
    return newErrors;
  };

  const peutInscrire = (info, heure = null) => {
    if (!form.nombreProches && form.nombreProches !== '0') return true;

    // Vérifier si le créneau est bloqué
    if (info.bloque) return false;

    // Le créneau de 15h00 n'a pas de limite
    if (heure === '15:00') return true;

    const personnesAInscrire = parseInt(form.nombreProches) + 1;
    return info.places_restantes >= personnesAInscrire;
  };


  const handleSubmit = async e => {
    e.preventDefault();
    const newErrors = validate();
    
    // Afficher les erreurs de validation une par une
    if (Object.keys(newErrors).length > 0) {
      Object.values(newErrors).forEach(errorMessage => {
        showAlert({
          title: 'Erreur de validation',
          subtitle: errorMessage,
          intent: 'error'
        });
      });
      return;
    }
    setLoading(true);
    try {
      const response = await apiPost('agents', {
        code_personnel: form.codePersonnel,
        nom: form.nom,
        prenom: form.prenom,
        nombre_proches: Number(form.nombreProches),
        heure_arrivee: form.heureArrivee,
        restauration_sur_place: form.restaurationSurPlace ? 1 : 0
      });

      // Sauvegarder les données pour le PDF
      setLastRegistrationData({...form});

      // Afficher un message de succès
      showAlert({
        title: 'Succès',
        subtitle: 'Inscription réussie !',
        intent: 'success'
      });

      // Réinitialiser le formulaire
      setForm({ codePersonnel: '', nom: '', prenom: '', nombreProches: '', heureArrivee: '', restaurationSurPlace: false });

      // Mettre à jour immédiatement les informations du créneau depuis la réponse
      if (response.creneau_info) {
        setCreneauxData(prevData => ({
          ...prevData,
          [response.creneau_info.heure]: {
            ...prevData[response.creneau_info.heure],
            personnes_total: response.creneau_info.personnes_total,
            places_restantes: response.creneau_info.places_restantes,
            complet: response.creneau_info.capacite !== 999 && response.creneau_info.personnes_total >= response.creneau_info.capacite
          }
        }));
      }

      // Recharger tous les créneaux pour s'assurer de la cohérence
      apiGet('creneaux')
        .then(data => {
          const flatData = {};
          Object.keys(data.matin || {}).forEach(heure => {
            flatData[heure] = data.matin[heure];
          });
          Object.keys(data['apres-midi'] || {}).forEach(heure => {
            flatData[heure] = data['apres-midi'][heure];
          });
          setCreneauxData(flatData);
        })
        .catch(() => {
          // En cas d'erreur, garder les données mises à jour localement
          console.error('Erreur lors du rechargement des créneaux');
        });
    } catch (e) {
      const msg = (e.message || '').toLowerCase();
      
      // Gestion spécifique des erreurs selon le type
      if (msg.includes('agent non autorisé') || msg.includes('nom/prénom incorrect') || msg.includes('not_in_whitelist') || msg.includes('identity_mismatch')) {
        const errorMessage = "Veuillez vérifier les informations saisies. Assurez-vous que votre code personnel, nom et prénom correspondent exactement aux données de votre dossier administratif.";

        showAlert({
          title: 'Erreur d\'autorisation',
          subtitle: errorMessage,
          intent: 'error'
        });
      } else if ((msg.includes('agent') && (msg.includes('déjà inscrit') || msg.includes('deja inscrit') || msg.includes('existe'))) || msg.includes('code personnel')) {
        const errorMessage = "Ce code personnel est déjà utilisé. Chaque agent ne peut s'inscrire qu'une seule fois.";

        showAlert({
          title: 'Erreur',
          subtitle: errorMessage,
          intent: 'error'
        });
      } else if (msg.includes('capacité') || msg.includes('complet') || msg.includes('dépassée')) {
        const errorMessage = "Le créneau sélectionné est complet. Veuillez choisir un autre créneau.";
        
        showAlert({
          title: 'Erreur',
          subtitle: errorMessage,
          intent: 'error'
        });
      } else if (msg.includes('délai') || msg.includes('timeout') || msg.includes('attente dépassé')) {
        showAlert({
          title: 'Délai dépassé',
          subtitle: e.message,
          intent: 'error'
        });
      } else if (msg.includes('connexion interrompue')) {
        showAlert({
          title: 'Connexion interrompue',
          subtitle: e.message,
          intent: 'error'
        });
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('connexion au serveur')) {
        showAlert({
          title: 'Erreur de connexion',
          subtitle: e.message,
          intent: 'error'
        });
      } else if (msg.includes('500') || msg.includes('serveur interne')) {
        showAlert({
          title: 'Erreur',
          subtitle: "Erreur du serveur. Vérifiez la base de données et les logs du serveur.",
          intent: 'error'
        });
      } else {
        showAlert({
          title: 'Erreur',
          subtitle: `Erreur lors de l'inscription : ${e.message}`,
          intent: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (rulesLoading) {
    return (
      <div className="gestion-container" style={{padding: '40px 20px', margin: '0 auto', textAlign: 'center'}}>
        <wcs-spinner style={{ display: 'block', margin: '16px auto' }}></wcs-spinner>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <SecurityRulesModal
        isOpen={!hasAcceptedRules}
        onAccept={acceptRules}
      />

      <div className="gestion-container" style={{padding: '40px 20px', margin: '0 auto'}}>
        <h2>📝 Inscription d'un agent</h2>
        <div style={{marginBottom: '20px', padding: '16px', backgroundColor: '#e8f5e8', borderRadius: '8px', textAlign: 'center', border: '2px solid #4caf50'}}>
          <div style={{fontSize: '1.1em', fontWeight: 'bold', color: '#2e7d32', marginBottom: '8px'}}>
            📅 {EVENT_CONFIG.name} - {EVENT_CONFIG.date}
          </div>
          <div style={{fontSize: '0.9em', color: '#1b5e20'}}>
            Système d'inscription en amont
          </div>
        </div>
        <div style={{marginBottom: '20px', padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center'}}>
          <strong>ℹ️ Durée de visite estimée à 2h</strong>
        </div>

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
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <wcs-label
                  style={{ marginBottom: 50 }}
                  required>Heure d'arrivée souhaitée</wcs-label>
            </div>
              {loadingCreneaux ? (
                <div style={{textAlign: 'center'}}>Chargement des créneaux...</div>
              ) : (
                <div style={{ width: '100%' }}>
                  {/* Section Matin */}
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ marginBottom: 16, padding: '8px 16px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
                      <strong>🌅 Créneaux du matin (9h00 - 12h20)</strong>
                      <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                        {creneauxMatin.length} créneaux disponibles
                      </div>
                    </div>
                    <div className="creneaux-grid">
                      {creneauxMatin.map(heure => {
                        const info = creneauxData[heure] || { personnes_total: 0, places_restantes: 14, complet: false, bloque: false, admin_only: false };
                        const isCreneauReserve = info.admin_only || false;
                        const isBloque = info.bloque || false;
                        const disabled = loading || info.complet || !peutInscrire(info, heure) || (isCreneauReserve && !isAdmin) || isBloque;
                        const bgColor = isBloque ? '#ffebee' : (isCreneauReserve ? '#fff3e0' : 'white');
                        const borderColor = isBloque ? '3px solid #dc3545' : (form.heureArrivee === heure ? '2px solid #0074D9' : '1px solid #ccc');
                        return (
                          <wcs-card key={heure} style={{ minWidth: 160, maxWidth: 180, margin: 0, padding: 12, opacity: disabled ? 0.6 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer', border: borderColor, backgroundColor: bgColor, position: 'relative' }} onClick={() => !disabled && handleCheckboxChange(heure)}>
                            {isBloque && (
                              <div style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#dc3545', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7em', fontWeight: 'bold' }}>
                                BLOQUÉ
                              </div>
                            )}
                            <div style={{ fontWeight: 'bold', fontSize: 18, color: isBloque ? '#999' : 'inherit' }}>{heure}</div>
                            {isBloque && (
                              <div style={{ margin: '4px 0', fontSize: '0.85em', color: '#dc3545', fontWeight: 'bold' }}>
                                🚫 Indisponible
                              </div>
                            )}
                            {isBloque && info.raison_blocage && (
                              <div style={{ margin: '4px 0', fontSize: '0.75em', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                                {info.raison_blocage}
                              </div>
                            )}
                            {!isBloque && isCreneauReserve && (
                              <div style={{ margin: '4px 0', fontSize: '0.8em', color: '#ff6b00', fontWeight: 'bold' }}>
                                {isAdmin ? '🔓 Admin connecté' : '🔒 Réservé aux bénévoles'}
                              </div>
                            )}
                            <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                              {!isBloque && !isCreneauReserve && <span>{info.places_restantes} places</span>}
                              {!isBloque && isCreneauReserve && <span>Illimité</span>}
                              {isBloque && <wcs-badge color="danger">⛔ BLOQUÉ</wcs-badge>}
                              {!isBloque && info.complet && <wcs-badge color="danger">Complet</wcs-badge>}
                              {!isBloque && isCreneauReserve && !isAdmin && <wcs-badge color="warning">Admin requis</wcs-badge>}
                              {!isBloque && isCreneauReserve && isAdmin && <wcs-badge color="success">Admin OK</wcs-badge>}
                              {!isBloque && !info.complet && !peutInscrire(info, heure) && form.nombreProches !== '' && !isCreneauReserve && <wcs-badge color="danger">Insuffisant</wcs-badge>}
                              {!isBloque && !info.complet && peutInscrire(info, heure) && info.places_restantes <= 3 && !isCreneauReserve && <wcs-badge color="warning">⚡ Limité</wcs-badge>}
                            </div>
                            <div style={{ marginTop: 8 }}>
                              {form.heureArrivee === heure && (
                                <MaterialIconWithFallback icon="check_circle" color="primary" size="m" />
                              )}
                              {form.heureArrivee !== heure && (
                                <MaterialIconWithFallback icon="radio_button_unchecked" color="gray" size="m" />
                              )}
                            </div>
                          </wcs-card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section Après-midi */}
                  <div>
                    <div style={{ marginBottom: 16, padding: '8px 16px', backgroundColor: '#fff3e0', borderRadius: '8px', textAlign: 'center' }}>
                      <strong>🌅 Créneaux de l'après-midi (13h00 - 15h00)</strong>
                      <div style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>
                        {creneauxApresMidi.length} créneaux disponibles
                      </div>
                    </div>
                    <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#fff3e0', borderRadius: '8px', border: '1px solid #ff9800' }}>
                      <div style={{ fontSize: '0.9em', color: '#e65100', textAlign: 'center' }}>
                        <strong>ℹ️ Note importante :</strong> Le créneau de 15h00 est réservé aux bénévoles.<br/>
                        {isAdmin ? (
                          <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✅ Vous êtes connecté en tant qu'administrateur et pouvez utiliser ce créneau.</span>
                        ) : (
                          'Pour toute inscription sur ce créneau, veuillez contacter un administrateur de l\'application.'
                        )}
                      </div>
                    </div>
                    <div className="creneaux-grid">
                      {creneauxApresMidi.map(heure => {
                        const info = creneauxData[heure] || { personnes_total: 0, places_restantes: 14, complet: false, bloque: false, admin_only: false };
                        const isCreneauReserve = info.admin_only || heure === '15:00'; // Fallback to 15:00 for backwards compatibility
                        const isBloque = info.bloque || false;
                        const disabled = loading || info.complet || !peutInscrire(info, heure) || (isCreneauReserve && !isAdmin) || isBloque;
                        const bgColor = isBloque ? '#ffebee' : (isCreneauReserve ? '#fff3e0' : 'white');
                        const borderColor = isBloque ? '3px solid #dc3545' : (form.heureArrivee === heure ? '2px solid #0074D9' : '1px solid #ccc');
                        return (
                          <wcs-card key={heure} style={{ minWidth: 160, maxWidth: 180, margin: 0, padding: 12, opacity: disabled ? 0.6 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer', border: borderColor, backgroundColor: bgColor, position: 'relative' }} onClick={() => !disabled && handleCheckboxChange(heure)}>
                            {isBloque && (
                              <div style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#dc3545', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7em', fontWeight: 'bold' }}>
                                BLOQUÉ
                              </div>
                            )}
                            <div style={{ fontWeight: 'bold', fontSize: 18, color: isBloque ? '#999' : 'inherit' }}>{heure}</div>
                            {isBloque && (
                              <div style={{ margin: '4px 0', fontSize: '0.85em', color: '#dc3545', fontWeight: 'bold' }}>
                                🚫 Indisponible
                              </div>
                            )}
                            {isBloque && info.raison_blocage && (
                              <div style={{ margin: '4px 0', fontSize: '0.75em', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                                {info.raison_blocage}
                              </div>
                            )}
                            {!isBloque && isCreneauReserve && (
                              <div style={{ margin: '4px 0', fontSize: '0.8em', color: '#ff6b00', fontWeight: 'bold' }}>
                                {isAdmin ? '🔓 Admin connecté' : '🔒 Réservé aux bénévoles'}
                              </div>
                            )}
                            <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                              {!isBloque && (
                                <span>
                                  {isCreneauReserve ? 'Illimité' : `${info.places_restantes} places`}
                                </span>
                              )}
                              {isBloque && <wcs-badge color="danger">⛔ BLOQUÉ</wcs-badge>}
                              {!isBloque && info.complet && <wcs-badge color="danger">Complet</wcs-badge>}
                              {!isBloque && isCreneauReserve && !isAdmin && <wcs-badge color="warning">Admin requis</wcs-badge>}
                              {!isBloque && isCreneauReserve && isAdmin && <wcs-badge color="success">Admin OK</wcs-badge>}
                              {!isBloque && !info.complet && !peutInscrire(info, heure) && form.nombreProches !== '' && !isCreneauReserve && <wcs-badge color="danger">Insuffisant</wcs-badge>}
                              {!isBloque && !info.complet && peutInscrire(info, heure) && info.places_restantes <= 3 && !isCreneauReserve && <wcs-badge color="warning">⚡ Limité</wcs-badge>}
                            </div>
                            <div style={{ marginTop: 8 }}>
                              {form.heureArrivee === heure && (
                                <MaterialIconWithFallback icon="check_circle" color="primary" size="m" />
                              )}
                              {form.heureArrivee !== heure && (
                                <MaterialIconWithFallback icon="radio_button_unchecked" color="gray" size="m" />
                              )}
                            </div>
                          </wcs-card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              <div style={{textAlign: 'center', marginTop: '16px'}}>
                <wcs-hint>Choisissez un créneau disponible</wcs-hint>
              </div>
          </div>
        </div>
        <wcs-button type="submit" color="primary" shape="block" disabled={loading} style={{marginTop: 15,width: '100%'}}>
          {loading ? <wcs-spinner size="small"></wcs-spinner> : "S'inscrire"}
        </wcs-button>
      </form>

      {/* Bouton de téléchargement PDF après inscription réussie */}
      {lastRegistrationData && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #4caf50'
        }}>
          <h3 style={{ color: '#2e7d32', marginBottom: '12px', fontSize: '16px' }}>
            ✅ Inscription confirmée !
          </h3>
          <p style={{ color: '#333', marginBottom: '16px', fontSize: '14px' }}>
            Votre réservation pour le {lastRegistrationData.heureArrivee} a été enregistrée.
          </p>
          <wcs-button
            color="secondary"
            onClick={() => downloadReservationPDF(lastRegistrationData)}
            style={{ marginRight: '10px' }}
          >
            📄 Télécharger le récapitulatif PDF
          </wcs-button>
          <wcs-button
            color="primary"
            fill="outline"
            onClick={() => setLastRegistrationData(null)}
          >
            Nouvelle inscription
          </wcs-button>
        </div>
      )}
      </div>
    </>
  );
} 