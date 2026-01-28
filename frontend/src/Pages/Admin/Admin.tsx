// src/Pages/Admin/Admin.tsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Sidebar from '../../Components/Admin/Sidebar'
import './Admin.css'
import AdminDashboard from './AdminDashboard'
import AdminMaidActivity from './AdminMaidActivity'

const translations = {
  en: {
    hotelLayoutManager: 'Hotel Layout Manager',
    logout: 'Logout',
    language: 'Language',
    english: 'English',
    french: 'French',
  },
  fr: {
    hotelLayoutManager: 'Gestionnaire de disposition hôtelière',
    logout: 'Déconnexion',
    language: 'Langue',
    english: 'Anglais',
    french: 'Français',
  },
}

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'maids'>('dashboard')
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [language, setLanguage] = useState<'en' | 'fr'>('en')

  const navigate = useNavigate()

  /** Load token & username (same as Maid Dashboard) */
  useEffect(() => {
    const localToken = localStorage.getItem('token')
    const localUsername = localStorage.getItem('username')
    const savedLanguage = localStorage.getItem('language') as 'en' | 'fr' | null

    setToken(localToken)
    setUsername(localUsername)
    if (savedLanguage) setLanguage(savedLanguage)
  }, [])

  // Save language to localStorage when changed
  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  /** Logout (same style as Maid Dashboard) */
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  return (
    <div className="admin-container">

      {/* Header */}
      <header className="admin-topbar">
        <div className="admin-top-left">{translations[language].hotelLayoutManager}</div>
        <div className="admin-top-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
            aria-label={translations[language].language}
          >
            <option value="en">{translations[language].english}</option>
            <option value="fr">{translations[language].french}</option>
          </select>
          <button className="btn small" onClick={handleLogout}>{translations[language].logout}</button>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab: String) => setActiveTab(tab as 'dashboard' | 'maids')}
        language={language}
      />

      {/* Main Content */}
      <main className="admin-main">
        {activeTab === 'dashboard' && <AdminDashboard token={token} language={language} />}
        {activeTab === 'maids' && <AdminMaidActivity token={token} language={language} />}
      </main>

    </div>
  )
}

export default Admin
