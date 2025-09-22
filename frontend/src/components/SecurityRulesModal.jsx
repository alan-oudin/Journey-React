import React, { useState, useEffect } from 'react';
import RegleSecuImage from '../assets/Regle_secu.png';

export default function SecurityRulesModal({ isOpen, onAccept }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleAccept = () => {
    setIsVisible(false);
    setTimeout(() => {
      onAccept();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`security-modal-overlay ${isVisible ? 'visible' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
    >
      <div
        className={`security-modal-content ${isVisible ? 'visible' : ''}`}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          transform: isVisible ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{
            color: '#d32f2f',
            marginBottom: '8px',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            🔒 Règles de Sécurité
          </h2>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Veuillez lire et accepter les règles de sécurité avant de continuer
          </p>
        </div>

        <div style={{ marginBottom: '32px', lineHeight: '1.6' }}>
          <div style={{
            backgroundColor: '#f3e5f5',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ba68c8'
          }}>
            <h3 style={{ color: '#7b1fa2', marginBottom: '16px', fontSize: '18px', textAlign: 'left' }}>
              📋 Règles sur site
            </h3>
            <div style={{ textAlign: 'center' }}>
              <img
                src={RegleSecuImage}
                alt="Règles de sécurité"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>

          <div style={{
            backgroundColor: '#fff3e0',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ffb74d'
          }}>
            <h3 style={{ color: '#e65100', marginBottom: '12px', fontSize: '18px' }}>
              🚗 Consignes de Stationnement et d'Accès
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Stationnement obligatoire sur le site</strong> uniquement
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Stationnement en marche arrière obligatoire</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Se signaler à l'entrée du site</strong> auprès de la personne responsable
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Se présenter 5-10 minutes avant</strong> le début du créneau
              </li>
            </ul>
          </div>

          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #64b5f6'
          }}>
            <h3 style={{ color: '#1976d2', marginBottom: '12px', fontSize: '18px' }}>
              ℹ️ Informations Importantes
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                La visite est limitée à <strong>2 heures maximum</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                Maximum <strong>4 proches accompagnants</strong> par agent
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Ponctualité requise</strong> pour respecter les créneaux
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Pièce d'identité obligatoire</strong> pour tous les visiteurs
              </li>
            </ul>
          </div>

          <div style={{
            backgroundColor: '#f3e5f5',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #ba68c8'
          }}>
            <h3 style={{ color: '#7b1fa2', marginBottom: '12px', fontSize: '18px' }}>
              📋 Responsabilités
            </h3>
            <p style={{ margin: 0 }}>
              En acceptant ces règles, vous vous engagez à respecter l'ensemble des consignes
              et à veiller à ce que vos accompagnants les respectent également. Tout manquement
              pourra entraîner l'interruption de la visite.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <wcs-button
            color="primary"
            size="large"
            onClick={handleAccept}
            style={{
              minWidth: '200px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ✅ J'accepte les règles de sécurité
          </wcs-button>
        </div>
      </div>
    </div>
  );
}