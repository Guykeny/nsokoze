import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Recherche from './pages/Recherche.jsx'
import Categorie from './pages/Categorie.jsx'
import BookingPage from './pages/BookingPage.jsx'
import Login from './pages/Login.jsx'
import Compte from './pages/Compte.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ServicesPage from './pages/Services.jsx'
import { LangProvider } from './lib/i18n.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recherche" element={<Recherche />} />
        <Route path="/c/:slug" element={<Categorie />} />
        <Route path="/s/:slug" element={<BookingPage />} />
        <Route path="/pro" element={<Login />} />
        <Route path="/compte" element={<Compte />} />
        <Route path="/pro/agenda" element={<Dashboard />} />
        <Route path="/pro/services" element={<ServicesPage />} />
      </Routes>
    </BrowserRouter>
    </LangProvider>
  </React.StrictMode>
)
