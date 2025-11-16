import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Eye } from 'lucide-react'

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
        <button className="btn primary">
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
                <button className="btn secondary" title="View Stats">
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
    </div>
  )
}

export default AdminMaidActivity