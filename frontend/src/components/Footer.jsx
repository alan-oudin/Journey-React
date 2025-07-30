import React from 'react';

export default function Footer() {
  return (
    <footer style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '16px 20px', 
      textAlign: 'center', 
      borderTop: '1px solid #e9ecef'
    }}>
      <p style={{ margin: '0', fontSize: '14px', color: '#6c757d' }}>
        En cas de besoin de modification ou d'annulation de votre inscription, vous pouvez contacter{' '}
        <a 
          href="mailto:joy.andre@sncf.fr?subject=Demande concernant l'inscription - Journée des Proches"
          style={{ color: '#0074D9', textDecoration: 'underline' }}
        >
          l'administrateur local de cette application
        </a>
      </p>
    </footer>
  );
}