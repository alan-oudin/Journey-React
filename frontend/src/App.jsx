import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GestionPage from './pages/GestionPage';
import InscriptionPage from './pages/InscriptionPage';
import LoginPage from './pages/LoginPage';
import RecherchePage from './pages/RecherchePage';
import Header from './components/Header';
import Navbar from './components/Navbar';
import { defineCustomElements } from 'wcs-react';
import './index.css';


const headerStyle = { 
  gridArea: 'header' 
};

const navStyle = { 
  gridArea: 'nav', 
  height: 'calc(100vh - 8 * var(--wcs-semantic-size-base))' 
};


defineCustomElements();

export default function App() {
  return (
    <Router>
      <div className="app-layout">
        <div style={headerStyle}><Header /></div>
        <div style={navStyle}><Navbar /></div>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<InscriptionPage />} />
            <Route path="/gestion" element={<GestionPage />} />
            <Route path="/recherche" element={<RecherchePage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}