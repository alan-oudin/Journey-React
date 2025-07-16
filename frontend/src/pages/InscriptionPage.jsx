import React, { useState, useEffect } from 'react';
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
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [creneaux, setCreneaux] = useState({ matin: {}, 'apres-midi': {} });
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setLoadingCreneaux(true);
    apiGet('creneaux')
      .then(data => setCreneaux(data))
      .catch(() => setCreneaux({ matin: {}, 'apres-midi': {} }))
      .finally(() => setLoadingCreneaux(false));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.codePersonnel.match(/^[0-9]{7}[A-Za-z]{1}$/)) {
      newErrors.codePersonnel = "Le code personnel doit comporter 7 chiffres suivis d'une lettre.";
    }
    if (!form.nom) newErrors.nom = "Le nom est requis.";
    if (!form.prenom) newErrors.prenom = "Le prénom est requis.";
    if (form.nombreProches === '') newErrors.nombreProches = "Veuillez sélectionner le nombre de proches.";
    if (!form.heureArrivee) newErrors.heureArrivee = "Veuillez choisir un créneau d'arrivée.";
    return newErrors;
  };

  const peutInscrire = (info) => {
    if (!form.nombreProches && form.nombreProches !== '0') return true;
    const personnesAInscrire = parseInt(form.nombreProches) + 1;
    return info.places_restantes >= personnesAInscrire;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setLoading(true);
    setAlertMessage('');
    try {
      await apiPost('agents', {
        code_personnel: form.codePersonnel,
        nom: form.nom,
        prenom: form.prenom,
        nombre_proches: Number(form.nombreProches),
        heure_arrivee: form.heureArrivee
      });
      setAlertType('success');
      setAlertMessage('Inscription réussie !');
      setForm({ codePersonnel: '', nom: '', prenom: '', email: '', nombreProches: '', heureArrivee: '' });
    } catch (e) {
      setAlertType('error');
      const msg = (e.message || '').toLowerCase();
      if (msg.includes('existe') || msg.includes('400') || msg.includes('409')) {
        setAlertMessage("Vous êtes déjà inscrit (si erreur veuillez contacter l'administrateur de l'application)");
      } else {
        setAlertMessage(e.message);
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
    <div style={{padding: 40}}>
      {alertMessage && (
        <wcs-alert color={alertType === 'success' ? 'success' : 'danger'} show>
          {alertMessage}
          <wcs-button slot="action" shape="clear" onClick={() => setAlertMessage('')}>Fermer</wcs-button>
        </wcs-alert>
      )}

      {loading && (
        <wcs-spinner style={{ display: 'block', margin: '16px auto' }}></wcs-spinner>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-columns">
          <div className="form-left">
          <h2>Inscription d'un agent</h2>
          <p>Journée des Proches - Système d'inscription en amont</p>
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
              {errors.codePersonnel && (
                <wcs-error style={{display: 'inline-flex', gap: 'var(--wcs-semantic-spacing-base)'}}>
                  <wcs-mat-icon icon="error" size="s"></wcs-mat-icon>
                  <span>{errors.codePersonnel}</span>
                </wcs-error>
              )}
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
              {errors.nom && (
                <wcs-error style={{display: 'inline-flex', gap: 'var(--wcs-semantic-spacing-base)'}}>
                  <wcs-mat-icon icon="error" size="s"></wcs-mat-icon>
                  <span>{errors.nom}</span>
                </wcs-error>
              )}
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
              {errors.prenom && (
                <wcs-error style={{display: 'inline-flex', gap: 'var(--wcs-semantic-spacing-base)'}}>
                  <wcs-mat-icon icon="error" size="s"></wcs-mat-icon>
                  <span>{errors.prenom}</span>
                </wcs-error>
              )}
              <wcs-hint id="hint-prenom">Prénom de l'agent</wcs-hint>
            </wcs-form-field>
            <wcs-form-field>
              <wcs-label required>Nombre de proches accompagnants</wcs-label>
              <wcs-select
                name="nombreProches"
                value={form.nombreProches}
                onInput={handleChange}
                required
                disabled={loading}
                aria-describedby="hint-nbproches"
              >
                <wcs-select-option value="">Sélectionner le nombre</wcs-select-option>
                <wcs-select-option value="0">0 proche (agent seul)</wcs-select-option>
                <wcs-select-option value="1">1 proche</wcs-select-option>
                <wcs-select-option value="2">2 proches</wcs-select-option>
                <wcs-select-option value="3">3 proches</wcs-select-option>
                <wcs-select-option value="4">4 proches (maximum autorisé)</wcs-select-option>
              </wcs-select>
              {errors.nombreProches && (
                <wcs-error style={{display: 'inline-flex', gap: 'var(--wcs-semantic-spacing-base)'}}>
                  <wcs-mat-icon icon="error" size="s"></wcs-mat-icon>
                  <span>{errors.nombreProches}</span>
                </wcs-error>
              )}
              <wcs-hint id="hint-nbproches">Nombre de proches maximum autorisé : 4</wcs-hint>
            </wcs-form-field>
          </div>
          <div className="form-separator"></div>
          <div className="form-right">
            <wcs-form-field>
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
                        <wcs-card key={heure} style={{ minWidth: 160, maxWidth: 180, margin: 0, padding: 12, opacity: disabled ? 0.5 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                          <div style={{ fontWeight: 'bold', fontSize: 18 }}>{heure}</div>
                          <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <span>{info.places_restantes} places</span>
                            {info.complet && <wcs-badge color="danger">Complet</wcs-badge>}
                            {!info.complet && info.places_restantes <= 3 && <wcs-badge color="warning">⚡ Limité</wcs-badge>}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <wcs-radio
                              name="heureArrivee"
                              label="Choisir"
                              value={heure}
                              checked={form.heureArrivee === heure}
                              onWcsChange={() => handleChange({ target: { name: 'heureArrivee', value: heure } })}
                              disabled={disabled}
                              required
                            ></wcs-radio>
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
                        <wcs-card key={heure} style={{ minWidth: 160, maxWidth: 180, margin: 0, padding: 12, opacity: disabled ? 0.5 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                          <div style={{ fontWeight: 'bold', fontSize: 18 }}>{heure}</div>
                          <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <span>{info.places_restantes} places</span>
                            {info.complet && <wcs-badge color="danger">Complet</wcs-badge>}
                            {!info.complet && info.places_restantes <= 3 && <wcs-badge color="warning">⚡ Limité</wcs-badge>}
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <wcs-radio
                              name="heureArrivee"
                              label="Choisir"
                              value={heure}
                              checked={form.heureArrivee === heure}
                              onWcsChange={() => handleChange({ target: { name: 'heureArrivee', value: heure } })}
                              disabled={disabled}
                              required
                            ></wcs-radio>
                          </div>
                        </wcs-card>
                      );
                    })}
                  </div>
                </div>
              )}
              {errors.heureArrivee && (
                <wcs-error style={{display: 'inline-flex', gap: 'var(--wcs-semantic-spacing-base)'}}>
                  <wcs-mat-icon icon="error" size="s"></wcs-mat-icon>
                  <span>{errors.heureArrivee}</span>
                </wcs-error>
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