import React from 'react';

export default function AgentCard({ agent, showActions = true, onSupprimer }) {
  const badgeColor = agent.creneauPrefere === 'matin' ? 'primary' : 'secondary';
  const creneauText = agent.creneauPrefere === 'matin'
    ? '🌅 MATIN (9h-12h)'
    : '🌆 APRÈS-MIDI (14h-17h)';

  return (
    <wcs-card style={{ marginBottom: 16, width: 320 }}>
      <div style={{ marginBottom: 8 }}><strong>Code Personnel :</strong> <span style={{ color: 'var(--wcs-semantic-color-text-link-default)' }}>{agent.codePersonnel}</span></div>
      <div><strong>Agent :</strong> {agent.prenom} {agent.nom}</div>
      <div><strong>Service :</strong> {agent.service}</div>
      <div><strong>Proches :</strong> {agent.nombreProches}</div>
      <div><strong>Créneau :</strong> <wcs-badge color={badgeColor}>{creneauText}</wcs-badge></div>
      <div><strong>Inscription :</strong> {agent.dateInscription}</div>
      {showActions && (
        <div style={{ marginTop: 12 }}>
          <wcs-button color="danger" onClick={() => onSupprimer(agent.codePersonnel)}>
            🗑️ Supprimer
          </wcs-button>
        </div>
      )}
    </wcs-card>
  );
}