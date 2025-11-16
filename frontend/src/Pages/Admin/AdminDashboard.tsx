import React, { useEffect, useState } from 'react'
import { Plus, ZoomIn, ZoomOut, Trash2, Layers } from 'lucide-react'

interface Floor {
  id: string
  floor_number: number
  name: string
}

interface Room {
  id: string
  room_number: number
  status: string
  grid_x: number
  grid_y: number
  floor_id: string
}

interface Props {
  token: string | null
}

const AdminDashboard: React.FC<Props> = ({ token }) => {
  const [floors, setFloors] = useState<Floor[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentFloor, setCurrentFloor] = useState<Floor | null>(null)

  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)

  const BASE_GRID = 60
  const GRID_ROWS = 10
  const GRID_COLS = 20
  const gridSize = BASE_GRID * zoom

  /** Fetch all floors using POST */
  const fetchFloors = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/listFloors/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      
      if (data.floors && Array.isArray(data.floors) && data.floors.length > 0) {
        // Map backend response to frontend interface
        const mappedFloors = data.floors.map((f: any) => ({
          id: f.floor_id.toString(),
          floor_number: f.floor_number,
          name: `Floor ${f.floor_number}`,
        }))
        
        setFloors(mappedFloors)
        setCurrentFloor(mappedFloors[0])
      } else {
        setFloors([])
        setCurrentFloor(null)
      }
    } catch (e) {
      console.error('Error loading floors:', e)
      setFloors([])
      setCurrentFloor(null)
    } finally {
      setLoading(false)
    }
  }

  /** Fetch rooms for current floor using POST */
  const fetchRooms = async () => {
    if (!currentFloor || !token) {
      setRooms([])
      return
    }

    try {
      const response = await fetch('/api/admin/viewRoom/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ floor_id: currentFloor.id }),
      })

      const data = await response.json()
      setRooms(data.rooms && Array.isArray(data.rooms) ? data.rooms : [])
    } catch (e) {
      console.error('Error loading rooms:', e)
      setRooms([])
    }
  }

  useEffect(() => {
    if (token) fetchFloors()
  }, [token])

  useEffect(() => {
    fetchRooms()
  }, [currentFloor, token])

  /** Zoom */
  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 1.5))
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3))

  if (loading) {
    return (
      <div className="center">
        <div className="loader"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="admin-dash">
      <header className="admin-dash-header">
        <h2>Admin Dashboard</h2>
        <div className="header-actions">
          <button onClick={zoomOut}>
            <ZoomOut size={20} />
          </button>
          <button onClick={zoomIn}>
            <ZoomIn size={20} />
          </button>

          <button className="btn primary">
            <Plus size={16} /> Add Room
          </button>

          <button className="btn green">
            <Layers size={16} /> New Floor
          </button>
        </div>
      </header>

      <div className="floor-select">
        <select
          value={currentFloor?.id || ''}
          onChange={(e) =>
            setCurrentFloor(floors.find((f) => f.id === e.target.value) || null)
          }
        >
          {floors.length === 0 ? (
            <option>No floors available</option>
          ) : (
            floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))
          )}
        </select>

        {currentFloor && (
          <button className="btn red">
            <Trash2 size={16} /> Delete Floor
          </button>
        )}
      </div>

      {/* GRID */}
      <div className="grid-container">
        <div
          className="grid"
          style={{
            width: GRID_COLS * gridSize,
            height: GRID_ROWS * gridSize,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        >
          {rooms.map((room) => (
            <div
              key={room.id}
              className="grid-room"
              style={{
                left: room.grid_x * gridSize,
                top: room.grid_y * gridSize,
                width: gridSize - 6,
                height: gridSize - 6,
              }}
            >
              {room.room_number}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard