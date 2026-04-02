import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProfileMaid.css'

const translations = {
  en: {
    profile: 'Profile',
    returnToDashboard: 'Return to Maid Dashboard',
    editProfile: 'Edit Profile',
    cancelEdit: 'Cancel Edit',
    name: 'Name',
    profileInfo: 'Profile Info',
    username: 'Username',
    email: 'Email',
    currentPassword: 'Current Password (required to change password)',
    newPassword: 'New Password',
    save: 'Save',
    reset: 'Reset',
    previousCleaningLogs: 'Previous Cleaning Logs',
    loadLogs: 'Load Logs',
    noLogs: 'No previous cleaning logs',
    room: 'Room',
    assigned: 'Assigned:',
    started: 'Started:',
    finished: 'Finished:',
    language: 'Language',
    english: 'English',
    french: 'French',
  },
  fr: {
    profile: 'Profil',
    returnToDashboard: 'Retour au tableau de bord de la femme de chambre',
    editProfile: 'Modifier le profil',
    cancelEdit: 'Annuler la modification',
    name: 'Nom',
    profileInfo: 'Informations sur le profil',
    username: 'Nom d\'utilisateur',
    email: 'Email',
    currentPassword: 'Mot de passe actuel (requis pour changer le mot de passe)',
    newPassword: 'Nouveau mot de passe',
    save: 'Sauvegarder',
    reset: 'Réinitialiser',
    previousCleaningLogs: 'Journaux de nettoyage précédents',
    loadLogs: 'Charger les journaux',
    noLogs: 'Aucun journal de nettoyage précédent',
    room: 'Chambre',
    assigned: 'Assigné:',
    started: 'Commencé:',
    finished: 'Terminé:',
    language: 'Langue',
    english: 'Anglais',
    french: 'Français',
  },
}

interface CleaningLog {
  log_id: number
  task_id: number
  maid_name: string
  room_number: number
  report: string
  assigned_time: string
  start_time: string
  finish_time: string
  battery_changed: boolean
  created_at: string
}

interface MaidProfile {
  name: string
  profile_info: string
  shift_days: string
  shift_start_time: string
  shift_end_time: string
  break_minutes: number
  created_at: string
  username: string
  email: string
}

const ProfileMaid = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [maidId, setMaidId] = useState<string | null>(null)
  const [logs, setLogs] = useState<CleaningLog[]>([])
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [language, setLanguage] = useState<'en' | 'fr'>('en')

  // Load language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'en' | 'fr' | null
    if (savedLanguage) setLanguage(savedLanguage)
  }, [])

  // Save language to localStorage when changed
  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  // Profile states
  const [profile, setProfile] = useState<MaidProfile | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    profile_info: '',
    username: '',
    email: '',
    current_password: '',
    new_password: '',
  })

  const getMaidId = async (username: string | null) => {
    if (!username || !token) return
    try {
      const response = await fetch('/api/getMaidId/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      })
      const data = await response.json()
      if (response.ok) setMaidId(data.maid_id)
      else console.error('Failed to get Maid Id', data)
    } catch (error) {
      console.error('Error getting maid Id:', error)
    }
  }

  // === Cleaning logs (unchanged) ===
  const fetchPrevLogs = async (maidId: string | null) => {
    if (!maidId || !token) return
    try {
      const response = await fetch('/api/cleaningLogs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ maid_id: maidId }),
      })
      const data = await response.json()
      if (response.ok) setLogs(data.cleaning_logs || [])
      else console.error('Failed to fetch cleaning logs', data)
    } catch (error) {
      console.error('Error fetching cleaning logs:', error)
    }
  }

  // === Profile functions ===
  const fetchProfile = async () => {
    if (!token) return
    try {
      const response = await fetch('/api/maid/viewProfile/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok) {
        const p = data.maid_profile
        setProfile(p)
        setProfileForm({
          name: p.name || '',
          profile_info: p.profile_info || '',
          username: p.username || '',
          email: p.email || '',
          current_password: '',
          new_password: '',
        })
      } else {
        console.error('Failed to fetch profile', data)
      }
    } catch (err) {
      console.error('Error fetching profile', err)
    }
  }

  const handleProfileEditSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    setServerMessage(null)
    if (!token) return
    try {
      const payload: any = {}
      // only send fields that the user provided / changed
      if (profileForm.name !== undefined) payload.name = profileForm.name
      if (profileForm.profile_info !== undefined) payload.profile_info = profileForm.profile_info
      if (profileForm.username !== undefined) payload.username = profileForm.username
      if (profileForm.email !== undefined) payload.email = profileForm.email
      // password change requires current_password + new_password per backend
      if (profileForm.new_password) {
        payload.current_password = profileForm.current_password
        payload.new_password = profileForm.new_password
      }

      const response = await fetch('/api/maid/editProfile/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setServerMessage(data.message || 'Profile updated successfully')
        // update local username if backend returned new username
        if (data.user && data.user.username) {
          localStorage.setItem('username', data.user.username)
          setUsername(data.user.username)
        } else if (profileForm.username) {
          // ensure local storage reflects the attempted username change
          localStorage.setItem('username', profileForm.username)
          setUsername(profileForm.username)
        }
        setEditMode(false)
        fetchProfile()
      } else {
        setServerMessage(data.error || data.detail || `Error ${response.status}`)
      }
    } catch (err) {
      setServerMessage((err as Error).message || 'Network error')
    }
  }

  useEffect(() => {
    const localToken = localStorage.getItem('token')
    const localUsername = localStorage.getItem('username')
    setToken(localToken)
    setUsername(localUsername)
  }, [])

  useEffect(() => {
    if (token && username) getMaidId(username)
  }, [token, username])

  useEffect(() => {
    if (token) fetchProfile()
  }, [token])

  const handleReturnToDashboard = () => navigate('/Dashboard')

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="header-top">
          <h2>{translations[language].profile}</h2>
          <div className="language-selector">
            <label>{translations[language].language}:</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')}>
              <option value="en">{translations[language].english}</option>
              <option value="fr">{translations[language].french}</option>
            </select>
          </div>
        </div>
        <div className="profile-actions">
          <button className="btn return-btn" onClick={handleReturnToDashboard}>
            {translations[language].returnToDashboard}
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              if (editMode) {
                if (profile) {
                  setProfileForm({
                    name: profile.name || '',
                    profile_info: profile.profile_info || '',
                    username: profile.username || '',
                    email: profile.email || '',
                    current_password: '',
                    new_password: '',
                  })
                }
                setServerMessage(null)
              }
              setEditMode(!editMode)
            }}
          >
            {editMode ? translations[language].cancelEdit : translations[language].editProfile}
          </button>
        </div>
      </div>

      {/* === Profile form (Name and Username editable) === */}
      {profile && (
        <div className="profile-info">
          <form className="profile-form" onSubmit={handleProfileEditSubmit}>
            <div className="form-row">
              <label>{translations[language].name}</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.currentTarget.value })}
                disabled={!editMode}
              />
            </div>

            <div className="form-row">
              <label>{translations[language].profileInfo}</label>
              <textarea
                value={profileForm.profile_info}
                onChange={(e) => setProfileForm({ ...profileForm, profile_info: e.currentTarget.value })}
                disabled={!editMode}
              />
            </div>

            <div className="form-row">
              <label>{translations[language].username}</label>
              <input
                type="text"
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: e.currentTarget.value })}
                disabled={!editMode}
              />
            </div>

            <div className="form-row">
              <label>{translations[language].email}</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.currentTarget.value })}
                disabled={!editMode}
              />
            </div>

            {/* Password fields — editable when in edit mode.
                Backend requires current_password when changing new_password. */}
            <div className="form-row">
              <label>{translations[language].currentPassword}</label>
              <input
                type="password"
                value={profileForm.current_password}
                onChange={(e) => setProfileForm({ ...profileForm, current_password: e.currentTarget.value })}
                disabled={!editMode}
              />
            </div>
            <div className="form-row">
              <label>{translations[language].newPassword}</label>
              <input
                type="password"
                value={profileForm.new_password}
                onChange={(e) => setProfileForm({ ...profileForm, new_password: e.currentTarget.value })}
                disabled={!editMode}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn" disabled={!editMode}>
                {translations[language].save}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setEditMode(false)
                  fetchProfile()
                }}
              >
                {translations[language].reset}
              </button>
            </div>

            {serverMessage && <div className="server-msg">{serverMessage}</div>}
          </form>
        </div>
      )}

      {/* === Existing cleaning logs section === */}
      <div className="previous-logs">
        <div className="prev-header">
          <h3>{translations[language].previousCleaningLogs}</h3>
          <button className="btn small" onClick={() => fetchPrevLogs(maidId)}>
            {translations[language].loadLogs}
          </button>
        </div>

        <div className="logs-list">
          {logs.length === 0 && <div className="empty">{translations[language].noLogs}</div>}
          {logs.map((log) => (
            <div key={log.log_id} className="log-item">
              <div className="log-row">
                <div className="log-room">{translations[language].room} {log.room_number}</div>
                <div className="log-task">{log.report}</div>
              </div>
              <div className="log-times">
                <div>{translations[language].assigned} {log.assigned_time}</div>
                <div>{translations[language].started} {log.start_time}</div>
                <div>{translations[language].finished} {log.finish_time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProfileMaid
// ...existing code...