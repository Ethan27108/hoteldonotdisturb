import React from 'react'

interface SidebarProps {
  activeTab: 'dashboard' | 'maids'
  onTabChange: (tab: 'dashboard' | 'maids') => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="sidebar">
      <ul>
        <li
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => onTabChange('dashboard')}
        >
          Dashboard
        </li>
        <li
          className={activeTab === 'maids' ? 'active' : ''}
          onClick={() => onTabChange('maids')}
        >
          Maids
        </li>
      </ul>
    </aside>
  )
}

export default Sidebar
