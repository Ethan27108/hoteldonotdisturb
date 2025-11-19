import SwitchButton from 'Components/SwitchButton'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

interface Task {
  task_id: number
  room_id: number
  room_number: number
  floor_number: number | null
  assignment_type: 'manual' | 'auto'
  status: 'pending' | 'in_progress' | 'completed'
  assigned_time: string
  start_time: string | null
  finish_time: string | null
  battery_change_required: boolean
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
  const [tasks, setTasks] = useState<Task[]>([])
  const [username, setUsername] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [maidId, setMaidId] = useState<string | null>(null)
  const navigate = useNavigate()

  const [comment, setComment] = useState<string>('')
  const handleCommentChange = (value: string) => setComment(value)

  const fmt = (v: any) => {
    const n = Number(v)
    return Number.isFinite(n) ? n.toFixed(2) : '-'
  }

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
      else console.error('Failed to get Maid Id')
    } catch (error) {
      console.error('Error getting maid Id:', error)
    }
  }

  const fetchStats = async (maidId: string | null) => {
    if (!maidId || !token) return
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
      if (response.ok) setStats(data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchTasks = async (maidId: string | null) => {
  if (!maidId || !token) return
  try {
    const response = await fetch('/api/maid/tasks/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ maidId }),
    })
    const data = await response.json()

    console.log('Backend tasks response:', data)  // <-- Add this line

    if (response.ok) setTasks(data.queue)
    else console.error('Failed to fetch tasks')
  } catch (error) {
    console.error('Error fetching tasks:', error)
  }
}


  const startCleaning = async (maid_id: string | null, room_id: number) => {
    if (!maidId || !token) return
    console.log('Starting cleaning for maid_id:', maid_id, 'room_id:', room_id)
    try {
      await fetch('/api/cleanStart/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ maid_id, room_id }),
      })
    } catch (error) {
      console.error('Error starting cleaning:', error)
    }
  }

  const endCleaning = async (
    maid_id: string | null,
    room_id: number,
    commentText: string = ''
  ) => {
    if (!maidId || !token) return
    try {
      await fetch('/api/cleanEnd/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ maid_id, room_id, comment: commentText }),
      })
    } catch (error) {
      console.error('Error ending cleaning:', error)
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
    if (maidId && token) {
      fetchTasks(maidId)
      fetchStats(maidId)
    }
  }, [maidId, token])

  useEffect(() => {
    if (!maidId || !token) return
    const intervalId = setInterval(() => {
      fetchTasks(maidId)
      fetchStats(maidId)
    }, intervalTime)
    return () => clearInterval(intervalId)
  }, [maidId, token, intervalTime])

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
          {tasks.length > 0 ? (
            <>
              <div className="room-header">
                <h2>Room {tasks[0].room_number}</h2>
                <div className="battery">
                  Battery change required:{' '}
                  {tasks[0].battery_change_required ? 'Yes' : 'No'}
                </div>
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
                  roomNum={tasks[0].room_number}
                  initialOn={tasks[0].status !== 'in_progress'}
                  onToggle={(on) => {
                    if (on) startCleaning(maidId, tasks[0].room_id)
                    else {
                      endCleaning(maidId, tasks[0].room_id, comment)
                      setComment('')
                      setTasks((t) => t.filter((x) => x.task_id !== tasks[0].task_id))
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
              {tasks.slice(1).length === 0 && <div className="empty">No upcoming rooms</div>}
              {tasks.slice(1).map((task) => (
                <div className="mini-room" key={task.task_id}>
                  <div>Room {task.room_number}</div>
                  <div className="mini-battery">
                    Battery change: {task.battery_change_required ? 'Yes' : 'No'}
                  </div>
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
