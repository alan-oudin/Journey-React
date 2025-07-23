import React from 'react';

export default function AlertMessage({ message, type = 'success', onClose }) {
  return (
    <wcs-alert color={type} show>
      {message}
      <wcs-button slot="action" shape="clear" onClick={onClose}>Fermer</wcs-button>
    </wcs-alert>
  );
}