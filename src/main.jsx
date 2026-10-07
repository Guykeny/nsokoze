import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import RetourHaut from './components/RetourHaut.jsx'
import { LangProvider } from './lib/i18n.jsx'
import './styles.css'

// Chaque page est téléchargée à la demande : l'accueil reste léger sur
// mobile (données 3G/4G), Leaflet et l'espace pro/admin ne sont chargés
// que par ceux qui en ont besoin.
const Recherche = lazy(() => import('./pages/Recherche.jsx'))
const Categorie = lazy(() => import('./pages/Categorie.jsx'))
const BookingPage = lazy(() => import('./pages/BookingPage.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Compte = lazy(() => import('./pages/Compte.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const ServicesPage = lazy(() => import('./pages/Services.jsx'))
const Blog = lazy(() => import('./pages/Blog.jsx'))
const Article = lazy(() => import('./pages/Article.jsx'))
const AdminBlog = lazy(() => import('./pages/AdminBlog.jsx'))
const AdminKpi = lazy(() => import('./pages/AdminKpi.jsx'))
const MotDePasse = lazy(() => import('./pages/MotDePasse.jsx'))
const APropos = lazy(() => import('./pages/APropos.jsx'))
const Legal = lazy(() => import('./pages/Legal.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))

// Service worker (PWA) : uniquement en production, pour ne pas
// interférer avec le rechargement à chaud de Vite en développement.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

const chargement = (
  <div className="page">
    <div className="chargement"><span className="spinner" /></div>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
    <BrowserRouter>
      <RetourHaut />
      <Suspense fallback={chargement}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recherche" element={<Recherche />} />
          <Route path="/c/:slug" element={<Categorie />} />
          <Route path="/s/:slug" element={<BookingPage />} />
          <Route path="/pro" element={<Login />} />
          <Route path="/compte" element={<Compte />} />
          <Route path="/pro/agenda" element={<Dashboard />} />
          <Route path="/pro/services" element={<ServicesPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<Article />} />
          <Route path="/admin/blog" element={<AdminBlog />} />
          <Route path="/admin/kpi" element={<AdminKpi />} />
          <Route path="/mot-de-passe" element={<MotDePasse />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/legal/:page" element={<Legal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </LangProvider>
  </React.StrictMode>
)
