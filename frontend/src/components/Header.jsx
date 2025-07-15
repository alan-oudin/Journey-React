import React from 'react';
import Navbar from './Navbar';
import './Header.css';

export default function Header() {
  return (
    <header className="app-header">
      <div className="app-title">Journée des Proches</div>
      <Navbar />
    </header>
  );
} 