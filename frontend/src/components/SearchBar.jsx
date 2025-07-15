import React from 'react';
import './SearchBar.css';

export default function SearchBar({ value, onChange, placeholder = 'Rechercher...' }) {
  return (
    <div className="search-bar">
      <div className="search-icon">🔍</div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        type="text"
        placeholder={placeholder}
        className="search-input"
      />
    </div>
  );
}
