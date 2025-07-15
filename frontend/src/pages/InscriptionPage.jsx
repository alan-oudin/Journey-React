import React, { useState, useEffect } from 'react';
import AlertMessage from '../components/AlertMessage';
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

  const peutInscrire = (info) => {
    if (!form.nombreProches && form.nombreProches !== '0') return true;
    const personnesAInscrire = parseInt(form.nombreProches) + 1;
    return info.places_restantes >= personnesAInscrire;
  };

  const handleSubmit = async e => {
    e.preventDefault();
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
      setAlertMessage(e.message);
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
    <div className="inscription-view">
      <h2>Inscription d'un agent</h2>
      <p className="subtitle">Journée des Proches - Système d'inscription en amont</p>

      {alertMessage && (
        <AlertMessage message={alertMessage} type={alertType} onClose={() => setAlertMessage('')} />
      )}

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Inscription en cours...</p>
        </div>
      )}

      <form className="inscription-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="codePersonnel">Code Personnel (CP) *</label>
          <input
            name="codePersonnel"
            value={form.codePersonnel}
            onChange={handleChange}
            type="text"
            id="codePersonnel"
            required
            pattern="[0-9]{7}[A-Za-z]{1}"
            title="7 chiffres suivis d'une lettre"
            placeholder="Ex: 1234567A"
            maxLength={8}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="nom">Nom *</label>
          <input
            name="nom"
            value={form.nom}
            onChange={handleChange}
            type="text"
            id="nom"
            required
            placeholder="Nom de famille"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="prenom">Prénom *</label>
          <input
            name="prenom"
            value={form.prenom}
            onChange={handleChange}
            type="text"
            id="prenom"
            required
            placeholder="Prénom"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="nombreProches">Nombre de proches accompagnants *</label>
          <select
            name="nombreProches"
            value={form.nombreProches}
            onChange={handleChange}
            id="nombreProches"
            required
            disabled={loading}
          >
            <option value="">Sélectionner le nombre</option>
            <option value="0">0 proche (agent seul)</option>
            <option value="1">1 proche</option>
            <option value="2">2 proches</option>
            <option value="3">3 proches</option>
            <option value="4">4 proches (maximum autorisé)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Heure d'arrivée souhaitée *</label>
          {loadingCreneaux ? (
            <div>Chargement des créneaux...</div>
          ) : (
            <>
              <div style={{marginBottom: 8}}><strong>🌅 Matin (9h00 - 11h40)</strong></div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16}}>
                {creneauxMatin.map(heure => {
                  const info = creneaux.matin[heure] || { personnes_total: 0, places_restantes: 14, complet: false };
                  const disabled = loading || info.complet || !peutInscrire(info);
                  return (
                    <label key={heure} style={{marginRight: 12, opacity: disabled ? 0.5 : 1}}>
                      <input
                        type="radio"
                        name="heureArrivee"
                        value={heure}
                        checked={form.heureArrivee === heure}
                        onChange={handleChange}
                        disabled={disabled}
                        required
                      />
                      {heure} ({info.places_restantes} places)
                      {info.complet && <span style={{color: 'red', marginLeft: 4}}>COMPLET</span>}
                      {!info.complet && info.places_restantes <= 3 && <span style={{color: 'orange', marginLeft: 4}}>⚡ Limité</span>}
                    </label>
                  );
                })}
              </div>
              <div style={{marginBottom: 8}}><strong>🌆 Après-midi (13h00 - 15h40)</strong></div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                {creneauxApresMidi.map(heure => {
                  const info = creneaux['apres-midi'][heure] || { personnes_total: 0, places_restantes: 14, complet: false };
                  const disabled = loading || info.complet || !peutInscrire(info);
                  return (
                    <label key={heure} style={{marginRight: 12, opacity: disabled ? 0.5 : 1}}>
                      <input
                        type="radio"
                        name="heureArrivee"
                        value={heure}
                        checked={form.heureArrivee === heure}
                        onChange={handleChange}
                        disabled={disabled}
                        required
                      />
                      {heure} ({info.places_restantes} places)
                      {info.complet && <span style={{color: 'red', marginLeft: 4}}>COMPLET</span>}
                      {!info.complet && info.places_restantes <= 3 && <span style={{color: 'orange', marginLeft: 4}}>⚡ Limité</span>}
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          Inscrire
        </button>
      </form>
    </div>
  );
} 