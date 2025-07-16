import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import AgentCard from '../components/AgentCard';
import { apiGet } from '../api';

const STATUTS = [
  { value: 'tous', label: 'Tous' },
  { value: 'inscrit', label: 'Inscrits' },
  { value: 'present', label: 'Présents' },
  { value: 'absent', label: 'Absents' },
  { value: 'annule', label: 'Annulés' }
];

const creneauxMatin = [
  '09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00', '11:20', '11:40'
];
const creneauxApresMidi = [
  '13:00', '13:20', '13:40', '14:00', '14:20', '14:40', '15:00', '15:20', '15:40'
];

export default function GestionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agents, setAgents] = useState([]);
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [creneaux, setCreneaux] = useState({ matin: {}, 'apres-midi': {} });
  const [loadingCreneaux, setLoadingCreneaux] = useState(false);

  const fetchAgents = () => {
    setLoading(true);
    apiGet('agents')
      .then(data => {
        setAgents(Array.isArray(data) ? data : []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

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

  useEffect(() => {
    fetchAgents();
    fetchStats();
    fetchCreneaux();
  }, []);

  const handleSupprimer = async codePersonnel => {
    if (!window.confirm('Supprimer cet agent ?')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const url = new URL('http://localhost:8080/journeyV2/backend/public/api.php');
      url.searchParams.append('path', 'agents');
      url.searchParams.append('code', codePersonnel);
      const response = await fetch(url, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setSuccess('Agent supprimé avec succès.');
        fetchAgents();
        fetchStats();
        fetchCreneaux();
      } else {
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatut = async (codePersonnel, nouveauStatut) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const url = new URL('http://localhost:8080/journeyV2/backend/public/api.php');
      url.searchParams.append('path', 'agents');
      url.searchParams.append('code', codePersonnel);
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveauStatut })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Statut modifié avec succès.');
        fetchAgents();
        fetchStats();
        fetchCreneaux();
      } else {
        setError(data.error || 'Erreur lors de la modification du statut');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const url = 'http://localhost:8080/journeyV2/backend/public/api.php?path=export';
    window.open(url, '_blank');
  };

  // Filtrage des agents selon le statut sélectionné
  const agentsFiltres = agents.filter(agent => {
    if (filtreStatut === 'tous') return agent.statut !== 'annule';
    return agent.statut === filtreStatut;
  });

  return (
    <div>
      <h2>👥 Gestion des inscriptions</h2>
      <p>Journée des Proches - Vue d'ensemble et administration</p>

      {loading && <wcs-spinner style={{ display: 'block', margin: '16px auto' }}></wcs-spinner>}

      {error && (
        <wcs-alert color="danger" show>
          {error}
          <wcs-button slot="action" shape="clear" onClick={() => setError('')}>Fermer</wcs-button>
        </wcs-alert>
      )}
      {success && (
        <wcs-alert color="success" show>
          {success}
          <wcs-button slot="action" shape="clear" onClick={() => setSuccess('')}>Fermer</wcs-button>
        </wcs-alert>
      )}

      <div style={{display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24}}>
        <StatCard number={stats ? stats.total_agents : agents.length} label="Total agents" />
        <StatCard number={stats ? stats.agents_presents : 0} label="Présents" />
        <StatCard number={stats ? stats.agents_inscrits : 0} label="Inscrits" />
        <StatCard number={stats ? stats.agents_absents : 0} label="Absents" />
        <StatCard number={stats ? stats.total_personnes : 0} label="Total personnes" />
      </div>

      <div style={{margin: '24px 0'}}>
        <strong>Filtrer par statut :</strong>{' '}
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

      <wcs-button color="primary" style={{marginTop: 16, marginBottom: 16}} onClick={handleExportCSV} disabled={loading || agents.length === 0}>
        📊 Exporter CSV
      </wcs-button>

      <h3 style={{marginTop: '2rem'}}>Disponibilité des créneaux</h3>
      {loadingCreneaux ? (
        <wcs-spinner style={{ display: 'block', margin: '16px auto' }}></wcs-spinner>
      ) : (
        <div style={{display: 'flex', gap: 32, flexWrap: 'wrap'}}>
          <wcs-card style={{minWidth: 320}}>
            <h4>🌅 Matin (9h00 - 11h40)</h4>
            <table style={{borderCollapse: 'collapse', width: '100%'}}>
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Agents</th>
                  <th>Personnes</th>
                  <th>Places libres</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {creneauxMatin.map(heure => {
                  const info = creneaux.matin[heure] || { agents_inscrits: 0, personnes_total: 0, places_restantes: 14, complet: false };
                  return (
                    <tr key={heure} style={{background: info.complet ? '#ffeaea' : info.places_restantes <= 3 ? '#fffbe6' : 'white'}}>
                      <td>{heure}</td>
                      <td>{info.agents_inscrits}</td>
                      <td>{info.personnes_total}</td>
                      <td>{info.places_restantes}</td>
                      <td>
                        {info.complet ? <span style={{color: 'red'}}>COMPLET</span> : info.places_restantes <= 3 ? <span style={{color: 'orange'}}>⚡ Limité</span> : <span style={{color: 'green'}}>LIBRE</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </wcs-card>
          <wcs-card style={{minWidth: 320}}>
            <h4>🌆 Après-midi (13h00 - 15h40)</h4>
            <table style={{borderCollapse: 'collapse', width: '100%'}}>
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Agents</th>
                  <th>Personnes</th>
                  <th>Places libres</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {creneauxApresMidi.map(heure => {
                  const info = creneaux['apres-midi'][heure] || { agents_inscrits: 0, personnes_total: 0, places_restantes: 14, complet: false };
                  return (
                    <tr key={heure} style={{background: info.complet ? '#ffeaea' : info.places_restantes <= 3 ? '#fffbe6' : 'white'}}>
                      <td>{heure}</td>
                      <td>{info.agents_inscrits}</td>
                      <td>{info.personnes_total}</td>
                      <td>{info.places_restantes}</td>
                      <td>
                        {info.complet ? <span style={{color: 'red'}}>COMPLET</span> : info.places_restantes <= 3 ? <span style={{color: 'orange'}}>⚡ Limité</span> : <span style={{color: 'green'}}>LIBRE</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </wcs-card>
        </div>
      )}

      <h3 style={{marginTop: '2rem'}}>Liste des agents inscrits</h3>
      <div>
        {agentsFiltres.length === 0 && !loading && <p>Aucun agent pour ce filtre.</p>}
        {agentsFiltres.map(agent => (
          <wcs-card key={agent.code_personnel} style={{ marginBottom: 24 }}>
            <AgentCard
              agent={{
                codePersonnel: agent.code_personnel,
                nom: agent.nom,
                prenom: agent.prenom,
                service: '',
                nombreProches: agent.nombre_proches,
                creneauPrefere: agent.heure_arrivee < '12:00' ? 'matin' : 'apres-midi',
                dateInscription: agent.date_inscription
              }}
              showActions={true}
              onSupprimer={handleSupprimer}
            />
            <div style={{ marginTop: 8 }}>
              <label>Statut : </label>
              <wcs-select
                value={agent.statut}
                onInput={e => handleChangeStatut(agent.code_personnel, e.target.value)}
                disabled={loading}
              >
                {STATUTS.filter(s => s.value !== 'tous').map(s => (
                  <wcs-select-option key={s.value} value={s.value}>{s.label}</wcs-select-option>
                ))}
              </wcs-select>
            </div>
          </wcs-card>
        ))}
      </div>
    </div>
  );
} 