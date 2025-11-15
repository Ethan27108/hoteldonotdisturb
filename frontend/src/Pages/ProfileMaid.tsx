import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ProfileMaid.css'

interface Room {
  room_id: number
  room_number: number
  status: string
  battery_indicator: number
  battery_last_checked: string
  updated_at: string
  comment: string
}

const ProfileMaid = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [maidId, setMaidId] = useState<string | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [usernameSwap, setUsernameSwap] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [serverMessage, setServerMessage] = useState<string | null>(null)

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

  const fetchPrevRooms = async (maidId: string | null) => {
    if (!maidId || !token) return
    try {
      const response = await fetch('/api/fetchPrevRoom/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ maidId }),
      })
      const data = await response.json()
      if (response.ok) setRooms(data.rooms || [])
      else console.error('Failed to fetch rooms', data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerMessage(null)
    try {
      const response = await fetch('/api/changeSettings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ usernameSwap, password }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setServerMessage(data.message || 'Settings updated.')
        // update local username if changed
        if (usernameSwap) localStorage.setItem('username', usernameSwap)
        setUsername(usernameSwap || username)
        setUsernameSwap('')
        setPassword('')
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
    if (localUsername) setUsernameSwap(localUsername)
  }, [])

  useEffect(() => {
    if (token && username) getMaidId(username)
  }, [token, username])

  const handleReturnToDashboard = () => navigate('/Dashboard') // adjust route if needed

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Profile</h2>
        <div className="profile-actions">
          <button className="btn return-btn" onClick={handleReturnToDashboard}>
            Return to Maid Dashboard
          </button>
        </div>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Username</label>
          <input
            type="text"
            value={usernameSwap}
            onChange={(e) => setUsernameSwap(e.currentTarget.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="form-row">
          <label>New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn">Save</button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setUsernameSwap(username || '')
              setPassword('')
              setServerMessage(null)
            }}
          >
            Reset
          </button>
        </div>

        {serverMessage && <div className="server-msg">{serverMessage}</div>}
      </form>

      <div className="previous-rooms">
        <div className="prev-header">
          <h3>Previous Rooms</h3>
          <button className="btn small" onClick={() => fetchPrevRooms(maidId)}>
            Load
          </button>
        </div>

        <div className="rooms-list">
          {rooms.length === 0 && <div className="empty">No previous rooms</div>}
          {rooms.map((r) => (
            <div key={r.room_id} className="room-item">
              <div className="room-row">
                <div className="room-num">Room {r.room_number}</div>
                <div className="room-batt">{r.battery_indicator}%</div>
              </div>
              <div className="room-comment">{r.comment}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProfileMaid