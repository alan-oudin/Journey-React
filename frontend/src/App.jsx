import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import InscriptionPage from './pages/InscriptionPage';
import LoginPage from './pages/LoginPage';
import RecherchePage from './pages/RecherchePage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { AlertDrawerProvider } from './contexts/AlertContext.tsx';
import { defineCustomElements } from 'wcs-react';
import './index.css';



defineCustomElements();

export default function App() {
  return (
    <AlertDrawerProvider 
      config={{
        position: 'top-right',
        showProgressBar: true,
        timeout: 5000
      }}
    >
      <Router basename="/journey">
        <div className="app-layout">
          <div className="header-area"><Header /></div>
          <div className="nav-area"><Navbar /></div>
          <main className="main-content content-area">
            <Routes>
              <Route path="/" element={<InscriptionPage />} />
              <Route path="/gestion" element={<Navigate to="/admin" replace />} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              } />
              <Route path="/recherche" element={
                <ProtectedRoute>
                  <RecherchePage />
                </ProtectedRoute>
              } />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </main>
          <div className="footer-area"><Footer /></div>
        </div>
      </Router>
    </AlertDrawerProvider>
  );
}