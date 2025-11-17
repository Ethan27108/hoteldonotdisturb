import SwitchButton from 'Components/SwitchButton'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

interface Room {
  room_id: number
  room_number: number
  status: string
  battery_indicator: number
  battery_last_checked: string
  updated_at: string
}

interface Stats {
  stat_id: number
  date: string
  total_rooms_cleaned: number
  avg_rooms_per_shift: number
  avg_time_per_room: number
  working_hours: number
  active_cleaning_hours: number
  completion_rate: number
  tasks_incomplete: number
  emergency_tasks_handled: number
  battery_changes_performed: number
  on_time_shift_attendance: number
  break_usage: number
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats[]>([])
  const [intervalTime, setIntervalTime] = useState<number>(15000) // 15 seconds
  const [rooms, setRooms] = useState<Room[]>([])
  const [username, setUsername] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [maidId, setMaidId] = useState<string | null>(null)
  const navigate = useNavigate()

  const [comment, setComment] = useState<string>('')
  const handleCommentChange = (value: string) => setComment(value)

  // format helper - round to 2 decimal places
  const fmt = (v: any) => {
    const n = Number(v)
    return Number.isFinite(n) ? n.toFixed(2) : '-'
  }

  const getMaidId = async (username: string | null) => {
    if (!username || !token) {
      console.error('Missing username or token for getMaidId')
      return
    }

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

      if (response.ok) {
        setMaidId(data.maid_id)
      } else {
        console.error('Failed to get Maid Id')
      }
    } catch (error) {
      console.error('Error getting maid Id:', error)
    }
  }

  const fetchStats = async (maidId: string | null) => {
    if (!maidId || !token) {
      console.error('Missing maidId or token for fetchStats')
      return
    }
    try {
      const response = await fetch('/api/viewStats/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ maidId }),
      })
      const data = await response.json()
      if (response.ok) {
        console.log(data.stats)
        setStats(data.stats)
      } else {
        console.error('Failed to fetch stats')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRooms = async (maidId: string | null) => {
    if (!maidId || !token) {
      console.error('Missing maidId or token for fetchRooms')
      return
    }

    try {
      const response = await fetch('/api/getRoom/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ maidId }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log(data.rooms)
        setRooms(data.rooms)
      } else {
        console.error('Failed to fetch rooms')
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const startCleaning = async (maid_id: string | null, room_number: number) => {
    if (!maidId || !token) {
      console.error('Missing maidId or token for startCleaning')
      return
    }

    try {
      const response = await fetch('/api/cleanStart/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ maid_id, room_number }),
      })

      if (response.ok) {
        console.log('Started cleaning room', room_number)
      } else {
        console.error('Failed to start cleaning')
      }
    } catch (error) {
      console.error('Error starting cleaning:', error)
    }
  }

  const endCleaning = async (
    maid_id: string | null,
    room_number: number,
    commentText: string = ''
  ) => {
    if (!maidId || !token) {
      console.error('Missing maidId or token for endCleaning')
      return
    }

    try {
      const response = await fetch('/api/cleanEnd/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ maid_id, room_number, comment: commentText }),
      })

      if (response.ok) {
        console.log('Ended cleaning room', room_number, 'comment sent:', commentText)
      } else {
        console.error('Failed to end cleaning')
      }
    } catch (error) {
      console.error('Error ending cleaning:', error)
    }
  }

  // Load token and username from localStorage once
  useEffect(() => {
    const localToken = localStorage.getItem('token')
    const localUsername = localStorage.getItem('username')

    setToken(localToken)
    setUsername(localUsername)
  }, [])

  // When token and username are ready, fetch maid ID
  useEffect(() => {
    if (token && username) {
      getMaidId(username)
    }
  }, [token, username])

  useEffect(() => {
    if (maidId && token) {
      fetchRooms(maidId)
      fetchStats(maidId)
    }
  }, [maidId, token])

  // polling for updates
  useEffect(() => {
    if (!maidId || !token) return
    const intervalId = setInterval(() => {
      fetchRooms(maidId)
      fetchStats(maidId)
    }, intervalTime)

    return () => clearInterval(intervalId)
  }, [maidId, token, intervalTime])

  // UI helpers
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  return (
    <div className="mobile-container">
      <header className="mobile-topbar">
        <div className="top-right">
          <button className="btn small" onClick={() => navigate('/ProfileMaid')}>
            Profile
          </button>
          <button className="btn small ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="mobile-main">
        <section className="current-room">
          {rooms.length > 0 ? (
            <>
              <div className="room-header">
                <h2>Room {rooms[0].room_number}</h2>
                <div className="battery">Battery: {rooms[0].battery_indicator}%</div>
              </div>

              <textarea
                className="comment-box"
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleCommentChange(e.currentTarget.value)
                }
                placeholder="Add comment about this room..."
                rows={4}
              />

              <div className="current-actions">
                <SwitchButton
                  name="Start Room Clean"
                  secondname="Stop Room Clean"
                  roomNum={rooms[0].room_number}
                  onToggle={(on) => {
                    if (on) {
                      startCleaning(maidId, rooms[0].room_number)
                      console.log('Start room cleaning timestamp recorded')
                    } else {
                      endCleaning(maidId, rooms[0].room_number, comment)
                      console.log('End room cleaning timestamp recorded, comment sent')
                      setComment('')
                      setRooms((r) => r.filter((x) => x.room_number !== rooms[0].room_number))
                    }
                  }}
                />
              </div>
            </>
          ) : (
            <div className="no-room">No current room assigned</div>
          )}
        </section>

        <section className="bottom-area">
          <aside className="next-rooms">
            <h3>Next Rooms</h3>
            <div className="next-list">
              {rooms.slice(1).length === 0 && <div className="empty">No upcoming rooms</div>}
              {rooms.slice(1).map((room) => (
                <div className="mini-room" key={room.room_number}>
                  <div>Room {room.room_number}</div>
                  <div className="mini-battery">{room.battery_indicator}%</div>
                </div>
              ))}
            </div>
          </aside>

          <aside className="mobile-stats">
            <h3>Stats</h3>
            <div className="stats-list">
              {stats.length === 0 && <div className="empty">No stats</div>}
              {stats.map((stat) => (
                <div className="stat-card" key={stat.stat_id}>
                  <div className="stat-date">{stat.date}</div>
                  <div>Total cleaned: {fmt(stat.total_rooms_cleaned)}</div>
                  <div>Avg/shift: {fmt(stat.avg_rooms_per_shift)}</div>
                  <div>Avg time/room: {fmt(stat.avg_time_per_room)} minutes</div>
                  <div>Working hours: {fmt(stat.working_hours)}</div>
                  <div>Active cleaning hours: {fmt(stat.active_cleaning_hours)}</div>
                  <div>Completion rate: {fmt(stat.completion_rate)}%</div>
                  <div>Tasks incomplete: {fmt(stat.tasks_incomplete)}</div>
                  <div>Emergency handled: {fmt(stat.emergency_tasks_handled)}</div>
                  <div>Battery changes: {fmt(stat.battery_changes_performed)}</div>
                  <div>On-time attendance: {fmt(stat.on_time_shift_attendance)}%</div>
                  <div>Break usage: {fmt(stat.break_usage)} minutes</div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default Dashboard