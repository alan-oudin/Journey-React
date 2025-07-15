import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GestionPage from './pages/GestionPage';
import InscriptionPage from './pages/InscriptionPage';
import LoginPage from './pages/LoginPage';
import RecherchePage from './pages/RecherchePage';
import Header from './components/Header';
import './App.css';

export default function App() {
  return (
    <Router>
      <Header />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<InscriptionPage />} />
          <Route path="/gestion" element={<GestionPage />} />
          <Route path="/recherche" element={<RecherchePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </div>
    </Router>
  );
} 