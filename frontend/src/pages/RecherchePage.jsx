import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import AlertMessage from '../components/AlertMessage';
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
    if (!value) return;
    setLoading(true);
    try {
      const agent = await apiGet('search', { q: value });
      setAgentTrouve(agent);
    } catch (e) {
      setAgentTrouve(null);
      setError("Aucun agent trouvé ou erreur : " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recherche-view">
      <h2>🔍 Recherche & Pointage - Jour J</h2>
      <p className="subtitle">Interface de recherche rapide et gestion des présences</p>

      {error && (
        <AlertMessage message={error} type="error" onClose={() => setError('')} />
      )}

      <SearchBar value={searchTerm} onChange={handleSearch} placeholder="Tapez le code personnel (CP) de l'agent..." />

      {loading && <div className="loading-indicator"><div className="spinner"></div><p>Recherche en cours...</p></div>}

      {agentTrouve && (
        <div className="agent-found">
          <h3>✅ Agent trouvé !</h3>
          <div><strong>{agentTrouve.prenom} {agentTrouve.nom}</strong> (CP : {agentTrouve.code_personnel})</div>
          <div>Nombre de proches : {agentTrouve.nombre_proches}</div>
          <div>Statut : {agentTrouve.statut}</div>
          <div>Heure d'arrivée : {agentTrouve.heure_arrivee}</div>
          <div>Date inscription : {agentTrouve.date_inscription}</div>
        </div>
      )}
    </div>
  );
} 