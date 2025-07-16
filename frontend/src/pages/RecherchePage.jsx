import React, { useState } from 'react';
import { apiGet } from '../api';

export default function RecherchePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentTrouve, setAgentTrouve] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async value => {
    setSearchTerm(value);
    setAgentTrouve(null);
    setError('');
    const regexCP = /^\d{7}[A-Z]$/;
    if (!value || !regexCP.test(value)) return;
    setLoading(true);
    try {
      const agent = await apiGet('search', { q: value });
      setAgentTrouve(agent);
    } catch (e) {
      setAgentTrouve(null);
      setError("L'agent n'est pas inscrit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
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

      {loading && <wcs-spinner style={{ display: 'block', margin: '16px auto' }}></wcs-spinner>}

      {agentTrouve && (
        <div className="agent-found">
          <wcs-card>
            <h3>✅ Agent trouvé !</h3>
            <div><strong>{agentTrouve.prenom} {agentTrouve.nom}</strong> (CP : {agentTrouve.code_personnel})</div>
            <div>Nombre de proches : {agentTrouve.nombre_proches}</div>
            <div>Statut : {agentTrouve.statut}</div>
            <div>Heure d'arrivée : {agentTrouve.heure_arrivee}</div>
            <div>Date inscription : {agentTrouve.date_inscription}</div>
          </wcs-card>
        </div>
      )}
    </div>
  );
} 