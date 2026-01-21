import SwitchButton from 'Components/SwitchButton'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const translations = {
  en: {
    profile: 'Profile',
    logout: 'Logout',
    room: 'Room',
    batteryChangeRequired: 'Battery change required:',
    yes: 'Yes',
    no: 'No',
    addComment: 'Add comment about this room...',
    startRoomClean: 'Start Room Clean',
    stopRoomClean: 'Stop Room Clean',
    noCurrentRoom: 'No current room assigned',
    nextRooms: 'Next Rooms',
    noUpcomingRooms: 'No upcoming rooms',
    batteryChange: 'Battery change:',
    stats: 'Stats',
    noStats: 'No stats',
    totalRoomsCleaned: 'Total rooms cleaned:',
    avgRoomsPerShift: 'Avg rooms per shift:',
    avgTimePerRoom: 'Avg time per room:',
    workingHours: 'Working hours:',
    activeCleaningHours: 'Active cleaning hours:',
    completionRate: 'Completion rate:',
    tasksIncomplete: 'Tasks incomplete:',
    emergencyHandled: 'Emergency handled:',
    batteryChanges: 'Battery changes:',
    onTimeAttendance: 'On-time attendance:',
    breakUsage: 'Break usage:',
    minutes: 'minutes',
    percent: '%',
    language: 'Language',
    english: 'English',
    french: 'French',
  },
  fr: {
    profile: 'Profil',
    logout: 'Déconnexion',
    room: 'Chambre',
    batteryChangeRequired: 'Changement de batterie requis:',
    yes: 'Oui',
    no: 'Non',
    addComment: 'Ajouter un commentaire sur cette chambre...',
    startRoomClean: 'Commencer le nettoyage de la chambre',
    stopRoomClean: 'Arrêter le nettoyage de la chambre',
    noCurrentRoom: 'Aucune chambre actuelle assignée',
    nextRooms: 'Chambres suivantes',
    noUpcomingRooms: 'Aucune chambre à venir',
    batteryChange: 'Changement de batterie:',
    stats: 'Statistiques',
    noStats: 'Aucune statistique',
    totalRoomsCleaned: 'Total des chambres nettoyées:',
    avgRoomsPerShift: 'Moyenne des chambres par quart:',
    avgTimePerRoom: 'Temps moyen par chambre:',
    workingHours: 'Heures de travail:',
    activeCleaningHours: 'Heures de nettoyage actives:',
    completionRate: 'Taux d\'achèvement:',
    tasksIncomplete: 'Tâches incomplètes:',
    emergencyHandled: 'Urgences traitées:',
    batteryChanges: 'Changements de batterie:',
    onTimeAttendance: 'Présence à l\'heure:',
    breakUsage: 'Utilisation des pauses:',
    minutes: 'minutes',
    percent: '%',
    language: 'Langue',
    english: 'Anglais',
    french: 'Français',
  },
}

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
  const [overall, setOverall] = useState<any>(null)
  const navigate = useNavigate()
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
      console.log('Backend stats response:', data)  // <-- Add this line
      if (response.ok) {
        setStats(data.stats)
        setOverall(data.overall)}
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
          <div className="language-selector">
            <label>{translations[language].language}:</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')}>
              <option value="en">{translations[language].english}</option>
              <option value="fr">{translations[language].french}</option>
            </select>
          </div>
          <button className="btn small" onClick={() => navigate('/ProfileMaid')}>
            {translations[language].profile}
          </button>
          <button className="btn small ghost" onClick={handleLogout}>
            {translations[language].logout}
          </button>
        </div>
      </header>

      <main className="mobile-main">
        <section className="current-room">
          {tasks.length > 0 ? (
            <>
              <div className="room-header">
                <h2>{translations[language].room} {tasks[0].room_number}</h2>
                <div className="battery">
                  {translations[language].batteryChangeRequired}{' '}
                  {tasks[0].battery_change_required ? translations[language].yes : translations[language].no}
                </div>
              </div>

              <textarea
                className="comment-box"
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleCommentChange(e.currentTarget.value)
                }
                placeholder={translations[language].addComment}
                rows={4}
              />

              <div className="current-actions">
                <SwitchButton
                  name={translations[language].startRoomClean}
                  secondname={translations[language].stopRoomClean}
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
            <div className="no-room">{translations[language].noCurrentRoom}</div>
          )}
        </section>

        <section className="bottom-area">
          <aside className="next-rooms">
            <h3>{translations[language].nextRooms}</h3>
            <div className="next-list">
              {tasks.slice(1).length === 0 && <div className="empty">{translations[language].noUpcomingRooms}</div>}
              {tasks.slice(1).map((task) => (
                <div className="mini-room" key={task.task_id}>
                  <div>{translations[language].room} {task.room_number}</div>
                  <div className="mini-battery">
                    {translations[language].batteryChange} {task.battery_change_required ? translations[language].yes : translations[language].no}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <aside className="mobile-stats">
            <h3>{translations[language].stats}</h3>
            <div className="stats-list">
              {!overall && <div className="empty">{translations[language].noStats}</div>}

              {overall && (
                <div className="stat-card">
                  <div>{translations[language].totalRoomsCleaned} {fmt(overall.total_rooms_cleaned)}</div>
                  <div>{translations[language].avgRoomsPerShift} {fmt(overall.avg_rooms_per_shift_overall)}</div>
                  <div>{translations[language].avgTimePerRoom} {fmt(overall.avg_time_per_room_overall)} {translations[language].minutes}</div>
                  <div>{translations[language].workingHours} {fmt(overall.total_working_hours)}</div>
                  <div>{translations[language].activeCleaningHours} {fmt(overall.total_active_cleaning_hours)}</div>
                  <div>{translations[language].completionRate} {fmt(overall.overall_completion_rate)}{translations[language].percent}</div>
                  <div>{translations[language].tasksIncomplete} {fmt(overall.total_tasks_incomplete)}</div>
                  <div>{translations[language].emergencyHandled} {fmt(overall.total_emergency_tasks_handled)}</div>
                  <div>{translations[language].batteryChanges} {fmt(overall.total_battery_changes_performed)}</div>
                  <div>{translations[language].onTimeAttendance} {fmt(overall.avg_on_time_shift_attendance)}{translations[language].percent}</div>
                  <div>{translations[language].breakUsage} {fmt(overall.avg_break_usage)} {translations[language].minutes}</div>
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
