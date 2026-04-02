import React from 'react'
import './Sidebar.css'
import { Home, User } from 'lucide-react'

const translations = {
  en: {
    dashboard: 'Dashboard',
    maids: 'Maids',
    admin: 'Admin',
    hotelDoNotDisturb: 'HotelDoNotDisturb',
  },
  fr: {
    dashboard: 'Tableau de bord',
    maids: 'Femmes de chambre',
    admin: 'Administrateur',
    hotelDoNotDisturb: 'HotelDoNotDisturb',
  },
}

interface SidebarProps {
  activeTab: 'dashboard' | 'maids'
  onTabChange: (tab: 'dashboard' | 'maids') => void
  language: 'en' | 'fr'
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, language }) => {
  const t = translations[language]
  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-brand">
        <div className="brand-mark">HD</div>
        <div className="brand-name">{t.hotelDoNotDisturb}</div>
      </div>

      <ul>
        <li
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => onTabChange('dashboard')}
        >
          <Home size={18} style={{ marginRight: 10 }} />
          {t.dashboard}
        </li>

        <li
          className={activeTab === 'maids' ? 'active' : ''}
          onClick={() => onTabChange('maids')}
        >
          <User size={18} style={{ marginRight: 10 }} />
          {t.maids}
        </li>
      </ul>

      <div className="sidebar-footer">
        <div style={{ fontSize: 12, color: 'rgba(15,23,42,0.6)' }}>{t.admin}</div>
      </div>
    </aside>
  )
}

export default Sidebar
