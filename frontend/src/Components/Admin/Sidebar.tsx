import React from 'react'
import './Sidebar.css'
import { Home, User } from 'lucide-react'

interface SidebarProps {
  activeTab: 'dashboard' | 'maids'
  onTabChange: (tab: 'dashboard' | 'maids') => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-brand">
        <div className="brand-mark">HD</div>
        <div className="brand-name">HotelDoNotDisturb</div>
      </div>

      <ul>
        <li
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => onTabChange('dashboard')}
        >
          <Home size={18} style={{ marginRight: 10 }} />
          Dashboard
        </li>

        <li
          className={activeTab === 'maids' ? 'active' : ''}
          onClick={() => onTabChange('maids')}
        >
          <User size={18} style={{ marginRight: 10 }} />
          Maids
        </li>
      </ul>

      <div className="sidebar-footer">
        <div style={{ fontSize: 12, color: 'rgba(15,23,42,0.6)' }}>Admin</div>
      </div>
    </aside>
  )
}

export default Sidebar
