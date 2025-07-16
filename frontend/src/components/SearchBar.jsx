import React from 'react';

export default function SearchBar({ value, onChange, placeholder = 'Rechercher...' }) {
  return (
    <wcs-form-field label={placeholder} style={{ width: '100%' }}>
      <wcs-input
        value={value}
        onInput={e => onChange(e.target.value)}
        type="text"
        icon="search"
        style={{ width: '100%' }}
      ></wcs-input>
    </wcs-form-field>
  );
}
