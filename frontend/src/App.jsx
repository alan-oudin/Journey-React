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



defineCustomElements();

export default function App() {
  return (
    <Router>
      <div className="app-layout">
        <div className="header-area"><Header /></div>
        <div className="nav-area"><Navbar /></div>
        <main className="main-content content-area">
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