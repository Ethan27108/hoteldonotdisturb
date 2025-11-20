import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Eye } from 'lucide-react'
import './AdminMaidActivity.css'
import CreateMaidForm from '../../Components/Admin/CreateMaidForm'
import EditMaidScheduleForm from '../../Components/Admin/EditMaidScheduleForm'

interface Maid {
  maid_id: string
  name: string
  user__is_active: boolean
}

interface Props {
  token: string | null
}

const AdminMaidActivity: React.FC<Props> = ({ token }) => {
  const [maids, setMaids] = useState<Maid[]>([])
  const [loading, setLoading] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const [selectedMaid, setSelectedMaid] = useState<Maid | null>(null)
  const [maidStats, setMaidStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [showCreateMaid, setShowCreateMaid] = useState(false)
  const [showEditSchedule, setShowEditSchedule] = useState(false)
  const [maidProfile, setMaidProfile] = useState<any>(null)

  const fetchMaids = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/listMaids/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      setMaids(data.maids && Array.isArray(data.maids) ? data.maids : [])
    } catch (e) {
      console.error('Error loading maids:', e)
      setMaids([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchMaids()
  }, [token])

  if (loading) {
    return (
      <div className="center">
        <div className="loader"></div>
        <p>Loading maids...</p>
      </div>
    )
  }

  return (
    <div className="maid-activity">
      <header className="maid-header">
        <h2>Maid Activity</h2>
        <button className="btn primary" onClick={() => setShowCreateMaid(true)}>
          <Plus size={16} /> Add Maid
        </button>
      </header>

      <div className="maid-list">
        {maids.length === 0 ? (
          <div className="empty">No maids available</div>
        ) : (
          maids.map((m) => (
            <div key={m.maid_id} className="maid-card">
              <div className="maid-info">
                <div className="maid-name">{m.name}</div>
                <div className={`maid-status status-${m.user__is_active ? 'active' : 'inactive'}`}>
                  {m.user__is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="maid-actions">
                <button
                  className="btn secondary"
                  title="View Stats"
                  onClick={async () => {
                    setSelectedMaid(m)
                    setShowStats(true)
                    setLoadingStats(true)
                    try {
                      const resp = await fetch('/api/admin/maidStats/', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ maid_id: m.maid_id }),
                      })

                      if (resp.ok) {
                        const data = await resp.json()
                        setMaidStats(data)
                      } else {
                        setMaidStats({ error: 'Failed to load stats' })
                      }
                    } catch (err) {
                      setMaidStats({ error: 'Network error' })
                    } finally {
                      setLoadingStats(false)
                    }
                  }}
                >
                  <Eye size={16} />
                </button>

                <button className="btn red" title="Remove Maid">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MAID STATS MODAL */}
      {showStats && selectedMaid && (
        <div className="modal-bg" onClick={() => setShowStats(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Maid Stats — {selectedMaid.name}</h3>

            {loadingStats ? (
              <div className="center">
                <div className="loader" />
                <p>Loading stats...</p>
              </div>
            ) : maidStats ? (
              <div className="maid-stats">
                {maidStats.error ? (
                  <div className="error">{maidStats.error}</div>
                ) : (
                  (() => {
                    const overall = maidStats.overall || {}
                    const latest = Array.isArray(maidStats.stats) && maidStats.stats.length > 0 ? maidStats.stats[0] : null

                    const pct = Number(overall.completion_rate ?? latest?.completion_rate ?? 0)

                    const fmt = (k: string, v: any) => {
                      if (v === null || v === undefined) return '—'
                      if (k.includes('time') && typeof v === 'number') return `${v} mins`
                      if (k.includes('rate') || k === 'completion_rate') return `${v}%`
                      return String(v)
                    }

                    return (
                      <>
                        <div className="stats-cards">
                          <div className="stat-card">
                            <div className="stat-label">Total Rooms Cleaned</div>
                            <div className="stat-value">{overall.total_rooms_cleaned ?? latest?.total_rooms_cleaned ?? '—'}</div>
                          </div>

                          <div className="stat-card">
                            <div className="stat-label">Avg Time / Room</div>
                            <div className="stat-value">{overall.avg_time_per_room ?? latest?.avg_time_per_room ?? '—'}</div>
                          </div>

                          <div className="stat-card">
                            <div className="stat-label">Working Hours</div>
                            <div className="stat-value">{overall.working_hours ?? latest?.working_hours ?? '—'}</div>
                          </div>

                          <div className="stat-card">
                            <div className="stat-label">Completion Rate</div>
                            <div className="stat-value">{pct}%</div>
                          </div>
                        </div>

                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontSize: 13, color: '#64748b' }}>Completion</div>
                            <div style={{ flex: 1 }}>
                              <div className="progress" aria-hidden>
                                <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                              </div>
                            </div>
                            <div style={{ minWidth: 48, textAlign: 'right', fontWeight: 700 }}>{pct}%</div>
                          </div>
                        </div>

                        <table className="stats-table">
                          <tbody>
                            {latest ? (
                              Object.entries(latest).filter(([k]) => k !== 'date').map(([k, v]) => (
                                <tr key={k}>
                                  <td className="key">{k.replace(/_/g, ' ')}</td>
                                  <td className="value">{fmt(k, v)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr><td className="key">No daily stats</td><td className="value">—</td></tr>
                            )}
                          </tbody>
                        </table>

                        <div className="modal-actions">
                          <button 
                            className="btn primary" 
                            onClick={async () => {
                              // Fetch maid profile to get current schedule
                              try {
                                const resp = await fetch('/api/admin/viewMaidProfile/', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({ maid_id: selectedMaid.maid_id }),
                                });

                                if (resp.ok) {
                                  const data = await resp.json();
                                  setMaidProfile(data.maid_profile);
                                  setShowEditSchedule(true);
                                } else {
                                  alert('Failed to load maid profile');
                                }
                              } catch (err) {
                                console.error('Error loading maid profile:', err);
                                alert('Failed to load maid profile');
                              }
                            }}
                          >
                            Edit Schedule
                          </button>
                          <button className="btn" onClick={() => setShowStats(false)}>Close</button>
                        </div>
                      </>
                    )
                  })()
                )}
              </div>
            ) : (
              <div className="muted">No stats available.</div>
            )}
          </div>
        </div>
      )}

      {/* CREATE MAID MODAL */}
      {showCreateMaid && (
        <CreateMaidForm
          onClose={() => setShowCreateMaid(false)}
          onSubmit={async (data) => {
            if (!token) return;

            try {
              // First create the maid account via signup endpoint
              const response = await fetch('/api/signup/maid/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  username: data.username,
                  password: data.password,
                  email: data.email,
                  name: data.name,
                  profile_info: data.profile_info || '',
                }),
              });

              if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to create maid account');
                return;
              }

              const result = await response.json();
              
              // If shift info provided, get the maid_id and set up profile
              if (data.shift_days && data.shift_days.length > 0 || data.shift_start_time || data.shift_end_time || data.break_minutes) {
                // Fetch the newly created maid's ID
                const maidsResponse = await fetch('/api/admin/listMaids/', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({}),
                });

                const maidsData = await maidsResponse.json();
                const newMaid = maidsData.maids?.find((m: any) => m.name === data.name);

                if (newMaid) {
                  // Setup maid profile with shift information
                  await fetch('/api/admin/setupMaidProfile/', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      maid_id: newMaid.maid_id,
                      shift_days: data.shift_days,
                      shift_start_time: data.shift_start_time,
                      shift_end_time: data.shift_end_time,
                      break_minutes: data.break_minutes,
                    }),
                  });
                }
              }

              alert('Maid created successfully!');
              fetchMaids(); // Refresh the list
            } catch (error) {
              console.error('Error creating maid:', error);
              alert('Failed to create maid');
            }
          }}
        />
      )}

      {/* EDIT MAID SCHEDULE MODAL */}
      {showEditSchedule && selectedMaid && maidProfile && (
        <EditMaidScheduleForm
          onClose={() => setShowEditSchedule(false)}
          maidId={selectedMaid.maid_id}
          maidName={selectedMaid.name}
          initialData={{
            shift_days: maidProfile.shift_days || [],
            shift_start_time: maidProfile.shift_start_time || '',
            shift_end_time: maidProfile.shift_end_time || '',
            break_minutes: maidProfile.break_minutes || 0,
          }}
          onSubmit={async (data) => {
            if (!token) return;

            try {
              const response = await fetch('/api/admin/setupMaidProfile/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  maid_id: selectedMaid.maid_id,
                  shift_days: data.shift_days,
                  shift_start_time: data.shift_start_time,
                  shift_end_time: data.shift_end_time,
                  break_minutes: data.break_minutes,
                }),
              });

              if (response.ok) {
                alert('Schedule updated successfully!');
                // Refresh maid stats if still viewing
                if (showStats) {
                  const resp = await fetch('/api/admin/maidStats/', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ maid_id: selectedMaid.maid_id }),
                  });

                  if (resp.ok) {
                    const data = await resp.json();
                    setMaidStats(data);
                  }
                }
              } else {
                const error = await response.json();
                alert(error.error || 'Failed to update schedule');
              }
            } catch (error) {
              console.error('Error updating schedule:', error);
              alert('Failed to update schedule');
            }
          }}
        />
      )}
    </div>
  )
}

export default AdminMaidActivity