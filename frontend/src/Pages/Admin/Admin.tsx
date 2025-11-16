// src/Pages/Admin/Admin.tsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Sidebar from '../../Components/Admin/Sidebar'
import AdminDashboard from './AdminDashboard'
import AdminMaidActivity from './AdminMaidActivity'

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'maids'>('dashboard')
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  const navigate = useNavigate()

  /** Load token & username (same as Maid Dashboard) */
  useEffect(() => {
    const localToken = localStorage.getItem('token')
    const localUsername = localStorage.getItem('username')

    setToken(localToken)
    setUsername(localUsername)
  }, [])

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
        <div className="admin-top-left">Hotel Layout Manager</div>
        <div className="admin-top-right">
          <button className="btn small" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab: String) => setActiveTab(tab as 'dashboard' | 'maids')}
      />

      {/* Main Content */}
      <main className="admin-main">
        {activeTab === 'dashboard' && <AdminDashboard token={token} />}
        {activeTab === 'maids' && <AdminMaidActivity token={token} />}
      </main>

    </div>
  )
}

export default Admin
