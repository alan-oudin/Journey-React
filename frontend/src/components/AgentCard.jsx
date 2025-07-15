import React from 'react';
import './AgentCard.css';

export default function AgentCard({ agent, showActions = true, onSupprimer }) {
  const badgeClass = agent.creneauPrefere === 'matin' ? 'badge badge-morning' : 'badge badge-afternoon';
  const creneauText = agent.creneauPrefere === 'matin'
    ? '🌅 MATIN (9h-12h)'
    : '🌆 APRÈS-MIDI (14h-17h)';

  return (
    <div className="agent-card">
      <div className="agent-info">
        <div className="info-item">
          <span className="info-label">Code Personnel</span>
          <span className="info-value highlight">{agent.codePersonnel}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Agent</span>
          <span className="info-value highlight">{agent.prenom} {agent.nom}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Service</span>
          <span className="info-value">{agent.service}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Proches</span>
          <span className="info-value large">{agent.nombreProches}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Créneau</span>
          <span className={badgeClass}>{creneauText}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Inscription</span>
          <span className="info-value">{agent.dateInscription}</span>
        </div>
      </div>
      {showActions && (
        <div className="agent-actions">
          <button className="btn btn-danger" onClick={() => onSupprimer(agent.codePersonnel)}>
            🗑️ Supprimer
          </button>
        </div>
      )}
    </div>
  );
}