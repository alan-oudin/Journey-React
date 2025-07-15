import React from 'react';
import './AlertMessage.css';

export default function AlertMessage({ message, type = 'success', onClose }) {
  const alertClass = `alert alert-${type}`;
  return (
    <div className={alertClass}>
      {message}
      <button className="alert-close" onClick={onClose}>&times;</button>
    </div>
  );
}