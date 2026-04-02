import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Eye } from 'lucide-react'
import './AdminMaidActivity.css'
import CreateMaidForm from '../../Components/Admin/CreateMaidForm'
import EditMaidScheduleForm from '../../Components/Admin/EditMaidScheduleForm'

const translations = {
  en: {
    maidActivity: 'Maid Activity',
    addMaid: 'Add Maid',
    noMaidsAvailable: 'No maids available',
    active: 'Active',
    inactive: 'Inactive',
    viewStats: 'View Stats',
    removeMaid: 'Remove Maid',
    maidStats: 'Maid Stats',
    loadingStats: 'Loading stats...',
    noStatsAvailable: 'No stats available.',
    totalRoomsCleaned: 'Total Rooms Cleaned',
    avgTimePerRoom: 'Avg Time / Room',
    workingHours: 'Working Hours',
    completionRate: 'Completion Rate',
    completion: 'Completion',
    noDailyStats: 'No daily stats',
    editSchedule: 'Edit Schedule',
    close: 'Close',
    totalRoomsCleanedLabel: 'total_rooms_cleaned',
    avgTimePerRoomLabel: 'avg_time_per_room',
    workingHoursLabel: 'working_hours',
    editScheduleButton: 'Edit Schedule',
    loadingMaids: 'Loading maids...',
  },
  fr: {
    maidActivity: 'Activité des femmes de chambre',
    addMaid: 'Ajouter une femme de chambre',
    noMaidsAvailable: 'Aucune femme de chambre disponible',
    active: 'Actif',
    inactive: 'Inactif',
    viewStats: 'Voir les statistiques',
    removeMaid: 'Supprimer la femme de chambre',
    maidStats: 'Statistiques de la femme de chambre',
    loadingStats: 'Chargement des statistiques...',
    noStatsAvailable: 'Aucune statistique disponible.',
    totalRoomsCleaned: 'Salles nettoyées au total',
    avgTimePerRoom: 'Temps moyen par salle',
    workingHours: 'Heures de travail',
    completionRate: 'Taux de complétion',
    completion: 'Complétude',
    noDailyStats: 'Aucune statistique quotidienne',
    editSchedule: 'Modifier l\'horaire',
    close: 'Fermer',
    totalRoomsCleanedLabel: 'total_rooms_cleaned',
    avgTimePerRoomLabel: 'avg_time_per_room',
    workingHoursLabel: 'working_hours',
    editScheduleButton: 'Modifier l\'horaire',
    loadingMaids: 'Chargement des femmes de chambre...',
  },
}

interface Maid {
  maid_id: string
  name: string
  user__is_active: boolean
}

interface Props {
  token: string | null
  language: 'en' | 'fr'
}

const AdminMaidActivity: React.FC<Props> = ({ token, language }) => {
  const t = translations[language]
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
        <p>{t.loadingMaids}</p>
      </div>
    )
  }

  return (
    <div className="maid-activity">
      <header className="maid-header">
        <h2>{t.maidActivity}</h2>
        <button className="btn primary" onClick={() => setShowCreateMaid(true)}>
          <Plus size={16} /> {t.addMaid}
        </button>
      </header>

      <div className="maid-list">
        {maids.length === 0 ? (
          <div className="empty">{t.noMaidsAvailable}</div>
        ) : (
          maids.map((m) => (
            <div key={m.maid_id} className="maid-card">
              <div className="maid-info">
                <div className="maid-name">{m.name}</div>
                <div className={`maid-status status-${m.user__is_active ? 'active' : 'inactive'}`}>
                  {m.user__is_active ? t.active : t.inactive}
                </div>
              </div>
              <div className="maid-actions">
                <button
                  className="btn secondary"
                  title={t.viewStats}
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

                <button 
                  className="btn red" 
                  title={t.removeMaid}
                  onClick={async () => {
                    if (!window.confirm(`${language === 'en' ? 'Are you sure you want to delete' : 'Êtes-vous sûr de vouloir supprimer'} ${m.name}? ${language === 'en' ? 'This action cannot be undone.' : 'Cette action ne peut pas être annulée.'}`)) {
                      return;
                    }

                    try {
                      const resp = await fetch('/api/admin/deactivateMaid/', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ maid_id: m.maid_id }),
                      });

                      if (resp.ok) {
                        alert(language === 'en' ? 'Maid deleted successfully' : 'Femme de chambre supprimée avec succès');
                        fetchMaids(); // Refresh the list
                      } else {
                        const error = await resp.json();
                        alert(error.error || (language === 'en' ? 'Failed to delete maid' : 'Échec de la suppression de la femme de chambre'));
                      }
                    } catch (err) {
                      console.error('Error deleting maid:', err);
                      alert(language === 'en' ? 'Failed to delete maid' : 'Échec de la suppression de la femme de chambre');
                    }
                  }}
                >
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
            <h3>{t.maidStats} — {selectedMaid.name}</h3>

            {loadingStats ? (
              <div className="center">
                <div className="loader" />
                <p>{t.loadingStats}</p>
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
                            <div className="stat-label">{t.totalRoomsCleaned}</div>
                            <div className="stat-value">{overall.total_rooms_cleaned ?? latest?.total_rooms_cleaned ?? '—'}</div>
                          </div>

                          <div className="stat-card">
                            <div className="stat-label">{t.avgTimePerRoom}</div>
                            <div className="stat-value">{overall.avg_time_per_room ?? latest?.avg_time_per_room ?? '—'}</div>
                          </div>

                          <div className="stat-card">
                            <div className="stat-label">{t.workingHours}</div>
                            <div className="stat-value">{overall.working_hours ?? latest?.working_hours ?? '—'}</div>
                          </div>

                          <div className="stat-card">
                            <div className="stat-label">{t.completionRate}</div>
                            <div className="stat-value">{pct}%</div>
                          </div>
                        </div>

                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontSize: 13, color: '#64748b' }}>{t.completion}</div>
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
                              <tr><td className="key">{t.noDailyStats}</td><td className="value">—</td></tr>
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
                                  alert(language === 'en' ? 'Failed to load maid profile' : 'Échec du chargement du profil de la femme de chambre');
                                }
                              } catch (err) {
                                console.error('Error loading maid profile:', err);
                                alert(language === 'en' ? 'Failed to load maid profile' : 'Échec du chargement du profil de la femme de chambre');
                              }
                            }}
                          >
                            {t.editScheduleButton}
                          </button>
                          <button className="btn" onClick={() => setShowStats(false)}>{t.close}</button>
                        </div>
                      </>
                    )
                  })()
                )}
              </div>
            ) : (
              <div className="muted">{t.noStatsAvailable}</div>
            )}
          </div>
        </div>
      )}

      {/* CREATE MAID MODAL */}
      {showCreateMaid && (
        <CreateMaidForm
          onClose={() => setShowCreateMaid(false)}
          language={language}
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
                alert(error.error || (language === 'en' ? 'Failed to create maid account' : 'Échec de la création du compte de femme de chambre'));
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

              alert(language === 'en' ? 'Maid created successfully!' : 'Femme de chambre créée avec succès!');
              fetchMaids(); // Refresh the list
            } catch (error) {
              console.error('Error creating maid:', error);
              alert(language === 'en' ? 'Failed to create maid' : 'Échec de la création de la femme de chambre');
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
          language={language}
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
                alert(language === 'en' ? 'Schedule updated successfully!' : 'Horaire mis à jour avec succès!');
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
                alert(error.error || (language === 'en' ? 'Failed to update schedule' : 'Échec de la mise à jour de l\'horaire'));
              }
            } catch (error) {
              console.error('Error updating schedule:', error);
              alert(language === 'en' ? 'Failed to update schedule' : 'Échec de la mise à jour de l\'horaire');
            }
          }}
        />
      )}
    </div>
  )
}

export default AdminMaidActivity