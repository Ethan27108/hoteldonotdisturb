import React, { useEffect, useState, useRef, useCallback } from "react";
import "./AdminDashboard.css";
import { Plus, Trash2, Layers, ZoomIn, ZoomOut } from "lucide-react";
import CreateRoomForm from "../../Components/Admin/CreateRoomForm";

const translations = {
  en: {
    adminDashboard: 'Admin Dashboard',
    createNewFloor: 'Create New Floor',
    floorNumber: 'Enter floor number',
    cancel: 'Cancel',
    create: 'Create',
    enterFloorNumber: 'Enter a floor number.',
    deleteFloor: 'Delete Floor',
    removeAllRooms: 'This will remove all rooms on this floor.',
    deleting: 'Deleting...',
    delete: 'Delete',
    deleteRoom: 'Delete Room',
    deleteRoomConfirm: 'Are you sure you want to delete Room',
    cannotBeUndone: 'This action cannot be undone.',
    noRoomsFloor: 'No rooms on this floor.',
    newFloor: 'New Floor',
    addRoom: 'Add Room',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    available: 'Cleaned',
    dirty: 'Dirty',
    cleaning: 'Cleaning',
    doNotDisturb: 'Do Not Disturb',
    emergency: 'Emergency',
    status: 'Status',
    room: 'Room',
    save: 'Save',
    editRoom: 'Edit Room',
    loadingDashboard: 'Loading Admin Dashboard...',
  },
  fr: {
    adminDashboard: 'Tableau de bord administrateur',
    createNewFloor: 'Créer un nouvel étage',
    floorNumber: 'Entrez le numéro de l\'étage',
    cancel: 'Annuler',
    create: 'Créer',
    enterFloorNumber: 'Entrez un numéro d\'étage.',
    deleteFloor: 'Supprimer l\'étage',
    removeAllRooms: 'Cela supprimera toutes les salles de cet étage.',
    deleting: 'Suppression...',
    delete: 'Supprimer',
    deleteRoom: 'Supprimer la salle',
    deleteRoomConfirm: 'Êtes-vous sûr de vouloir supprimer la salle',
    cannotBeUndone: 'Cette action ne peut pas être annulée.',
    noRoomsFloor: 'Aucune salle à cet étage.',
    newFloor: 'Nouvel étage',
    addRoom: 'Ajouter une salle',
    zoomIn: 'Zoomer',
    zoomOut: 'Dézoomer',
    available: 'Nettoyé',
    dirty: 'Sale',
    cleaning: 'En nettoyage',
    doNotDisturb: 'Ne pas déranger',
    emergency: 'Urgence',
    status: 'Statut',
    room: 'Salle',
    battery: 'Batterie',
    save: 'Enregistrer',
    editRoom: 'Modifier la salle',
    loadingDashboard: 'Chargement du tableau de bord administrateur...',
  },
};

interface Floor {
  id: string;
  floor_number: number;
  name: string;
}

interface Room {
  id: string;
  room_number: number;
  status: string;
  pos_x: number;
  pos_y: number;
  battery_level: number;
  floor_id: string;
}

interface Props {
  token: string | null;
  language: 'en' | 'fr';
}

const AdminDashboard: React.FC<Props> = ({ token, language }) => {
  const t = translations[language];
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentFloor, setCurrentFloor] = useState<Floor | null>(() => {
    const stored = localStorage.getItem("selectedFloor");
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState<number>(1);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<string | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const roomsRef = useRef<Room[]>([]);
  const tokenRef = useRef<string | null>(token);
  const currentFloorRef = useRef<Floor | null>(currentFloor);
  const [showCreateFloor, setShowCreateFloor] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newFloorNumber, setNewFloorNumber] = useState("");
  const [createFloorError, setCreateFloorError] = useState<string | null>(null);
  const [deletingFloor, setDeletingFloor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showEditRoom, setShowEditRoom] = useState(false);
  const [editStatus, setEditStatus] = useState<string>("");

  /** Fetch Floors */
  const fetchFloors = async () => {
    if (!token) return;

    try {
      const resp = await fetch("/api/admin/listFloors/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await resp.json();
      if (data.floors && Array.isArray(data.floors)) {
        const mapped = data.floors.map((f: any) => ({
          id: String(f.floor_id),
          floor_number: f.floor_number,
          name: `Floor ${f.floor_number}`,
        }));
        setFloors(mapped);
        if (!currentFloor && mapped.length > 0) {
          setCurrentFloor(mapped[0]);
        }
      }
    } catch (err) {
      console.error("Error loading floors:", err);
    } finally {
      setLoading(false);
    }
  };

  /** Fetch Rooms for a Floor */
  const fetchRooms = async (floor: Floor | null) => {
    if (!token || !floor) return;

    try {
      const resp = await fetch("/api/admin/viewRoom/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ floor_id: floor.id }),
      });

      if (resp.status !== 200) {
        setRooms([]);
        return;
      }

      const data = await resp.json();
      const mapped = data.map((r: any) => ({
        id: String(r.id),
        room_number: Number(r.room_number),
        status: r.status ?? "clean",
        pos_x: Number(r.pos_x ?? r.grid_x ?? 0),
        pos_y: Number(r.pos_y ?? r.grid_y ?? 0),
        battery_level: r.battery_level ?? r.battery_indicator ?? 100,
        floor_id: String(r.floor_id),
      }));

      setRooms(mapped);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setRooms([]);
    }
  };

  useEffect(() => {
    fetchFloors();
    const interval = setInterval(() => {
      fetchFloors();
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (currentFloor) {
      localStorage.setItem("selectedFloor", JSON.stringify(currentFloor));
    }
  }, [currentFloor]);

  useEffect(() => {
    fetchRooms(currentFloor);
    const interval = setInterval(() => {
      fetchRooms(currentFloor);
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [currentFloor, token]);

  // Drag handlers
  const onPointerMove = useCallback((e: PointerEvent) => {
    const id = draggingRef.current;
    if (!id || !gridRef.current) return;
    isDraggingRef.current = true; // Mark that dragging occurred
    const rect = gridRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    let px = ((clientX - rect.left) / rect.width) * 100;
    let py = ((clientY - rect.top) / rect.height) * 100;
    px = Math.max(0, Math.min(100, px));
    py = Math.max(0, Math.min(100, py));

    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, pos_x: Number(px.toFixed(1)), pos_y: Number(py.toFixed(1)) } : r)));
  }, []);

  const onPointerUp = useCallback(() => {
    const draggedId = draggingRef.current;
    const wasDragging = isDraggingRef.current;
    draggingRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    
    // Reset dragging flag after a short delay to allow click event to check it
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);

    // Persist the final position of the dragged room (only if actually dragged)
    (async () => {
      if (!draggedId || !wasDragging) return;
      const latestRooms = roomsRef.current || [];
      const r = latestRooms.find((x) => x.id === draggedId);
      if (!r) return;

      try {
        const t = tokenRef.current;
        const floor = currentFloorRef.current;
        if (!t) return;

        const body: any = {
          room_id: r.id,
          pos_x: Math.round(Number(r.pos_x)),
          pos_y: Math.round(Number(r.pos_y)),
        };

        const resp = await fetch("/api/admin/editRoom/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${t}`,
          },
          body: JSON.stringify(body),
        });

        if (resp.status === 200) {
          // refresh rooms to pick up any server-side normalization
          fetchRooms(floor || null);
        } else {
          let bodyText = null;
          try {
            const jb = await resp.json();
            bodyText = jb.error || JSON.stringify(jb);
          } catch (e) {
            try {
              bodyText = await resp.text();
            } catch (e2) {
              bodyText = `HTTP ${resp.status}`;
            }
          }
          console.error("Save room position failed:", resp.status, bodyText);
          alert(bodyText || "Failed to save room position");
          fetchRooms(floor || null);
        }
      } catch (err) {
        console.error("Network error saving room position:", err);
        alert("Network error saving room position");
        fetchRooms(currentFloorRef.current || null);
      }
    })();
  }, [onPointerMove]);

  const startDrag = (e: React.PointerEvent, id: string) => {
    // Use pointer events for consistent mouse/touch behavior
    (e.target as Element).setPointerCapture?.(e.pointerId);
    draggingRef.current = id;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Map backend status to display-friendly label
  const getStatusLabel = (backendStatus: string): string => {
    const map: Record<string, string> = {
      clean: t.available,
      dirty: t.dirty,
      cleaning_in_progress: t.cleaning,
      do_not_disturb: t.doNotDisturb,
      emergency_clean: t.emergency,
    };
    return map[backendStatus] || backendStatus;
  };

  // keep refs up-to-date so the pointer callbacks can read latest values
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    currentFloorRef.current = currentFloor;
  }, [currentFloor]);

  if (loading)
    return (
      <div className="center">
        <div className="loader" />
        <p>{t.loadingDashboard}</p>
      </div>
    );

  return (
    <div className="admin-dash">
      <div className="admin-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb', letterSpacing: 1 }}>{t.adminDashboard}</div>
      </div>
      {/* Only one header with logout button at right */}
      {/* CREATE FLOOR MODAL */}
      {showCreateFloor && (
        <div className="modal-bg" onClick={() => setShowCreateFloor(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t.createNewFloor}</h3>

            <input
              type="number"
              min={1}
              value={newFloorNumber}
              onChange={(e) => setNewFloorNumber(e.target.value)}
              placeholder={t.floorNumber}
            />

            {createFloorError && <p className="error">{createFloorError}</p>}

            <div className="modal-actions">
              <button className="btn" onClick={() => setShowCreateFloor(false)}>
                {t.cancel}
              </button>

              <button
                className="btn primary"
                onClick={async () => {
                  if (!newFloorNumber) {
                    setCreateFloorError(t.enterFloorNumber);
                    return;
                  }

                  try {
                    const resp = await fetch("/api/admin/addFloor/", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        floor_number: newFloorNumber,
                        name: `Floor ${newFloorNumber}`,
                      }),
                    });

                    if (resp.status === 200 || resp.status === 201) {
                      setShowCreateFloor(false);
                      setNewFloorNumber("");
                      fetchFloors();
                    } else {
                      // Try to parse JSON, but fall back to text for non-JSON responses
                      let bodyText = null;
                      try {
                        const body = await resp.json();
                        bodyText = body.error || JSON.stringify(body);
                      } catch (e) {
                        try {
                          bodyText = await resp.text();
                        } catch (e2) {
                          bodyText = `HTTP ${resp.status}`;
                        }
                      }

                      console.error("Create floor failed:", resp.status, bodyText);
                      setCreateFloorError(bodyText || "Failed to create floor.");
                      // also show an alert so it's obvious during development
                      alert(`Create floor failed: ${bodyText || resp.status}`);
                    }
                  } catch (err) {
                    console.error("Network error while creating floor:", err);
                    setCreateFloorError("Network error. Check backend server and console.");
                    alert("Network error while creating floor. Check backend server.");
                  }
                }}
              >
                {t.create}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* FLOOR LIST & ADD ROOM */}
      <div className="floor-select" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="floor-list" style={{ display: 'flex', gap: 12 }}>
            {floors.map((f) => (
              <button
                key={f.id}
                className={`floor-item ${currentFloor?.id === f.id ? "active" : ""}`}
                onClick={() => setCurrentFloor(f)}
              >
                {f.name}
              </button>
            ))}
          </div>
          {currentFloor && (
            <button className="btn red" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Zoom controls */}
          <div className="grid-controls">
            <button
              className="btn zoom-btn"
              title={t.zoomIn}
              onClick={() => setScale((s) => Math.min(2, Number((s + 0.1).toFixed(1))))}
            >
              <ZoomIn size={16} />
            </button>

            <button
              className="btn zoom-btn"
              title={t.zoomOut}
              onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.1).toFixed(1))))}
            >
              <ZoomOut size={16} />
            </button>
          </div>

          {/* Move New Floor next to Add Room */}
          <button className="btn green" onClick={() => setShowCreateFloor(true)}>
            <Layers size={16} /> {t.newFloor}
          </button>

          <button
            className="btn primary"
            style={{ marginBottom: 0 }}
            onClick={() => setShowCreateRoom(true)}
            disabled={!currentFloor}
          >
            <Plus size={16} /> {t.addRoom}
          </button>
        </div>
      </div>

      {/* DELETE FLOOR CONFIRM */}
      {showDeleteConfirm && currentFloor && (
        <div className="modal-bg" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t.deleteFloor} {currentFloor.floor_number}?</h3>
            <p>{t.removeAllRooms}</p>

            <div className="modal-actions">
              <button className="btn" onClick={() => setShowDeleteConfirm(false)}>
                {t.cancel}
              </button>

              <button
                className="btn red"
                disabled={deletingFloor}
                onClick={async () => {
                  setDeletingFloor(true);

                  try {
                    const resp = await fetch("/api/admin/deleteFloor/", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ floor_id: currentFloor.id }),
                    });

                    if (resp.status === 200) {
                      setShowDeleteConfirm(false);
                      fetchFloors();
                    }
                  } finally {
                    setDeletingFloor(false);
                  }
                }}
              >
                {deletingFloor ? t.deleting : t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ROOM */}
      {showCreateRoom && currentFloor && (
        <CreateRoomForm
          floor_id={currentFloor.id}
          onClose={() => setShowCreateRoom(false)}
          language={language}
          onSubmit={async (data) => {
            try {
              // Build request body according to backend expectations
              const body: any = { room_number: data.room_number };

              if (data.floor_id) body.floor_id = data.floor_id;
              else if (data.floor_number) body.floor_number = data.floor_number;

              // Default to 0,0 if not provided
              body.pos_x = data.pos_x !== undefined ? data.pos_x : 0;
              body.pos_y = data.pos_y !== undefined ? data.pos_y : 0;
              if (data.status) body.status = data.status;

              const resp = await fetch("/api/admin/addRoom/", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
              });

              if (resp.status === 200 || resp.status === 201) {
                setShowCreateRoom(false);
                fetchRooms(currentFloor);
              } else {
                // try parse JSON, fall back to text
                let bodyText = null;
                try {
                  const jb = await resp.json();
                  bodyText = jb.error || JSON.stringify(jb);
                } catch (e) {
                  try {
                    bodyText = await resp.text();
                  } catch (e2) {
                    bodyText = `HTTP ${resp.status}`;
                  }
                }
                console.error("Create room failed:", resp.status, bodyText);
                alert(bodyText || "Failed to create room");
              }
            } catch (err) {
              console.error("Network error while creating room:", err);
              alert("Network error");
            }
          }}
        />
      )}



      {/* EDIT ROOM STATUS MODAL */}
      {showEditRoom && selectedRoom && (
        <div className="modal-bg" onClick={() => setShowEditRoom(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t.editRoom} {selectedRoom.room_number}</h3>
            
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginTop: '12px' }}>{t.status}</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', marginTop: '4px', fontSize: '15px' }}
            >
              <option value="clean">{t.available}</option>
              <option value="cleaning_in_progress">{t.cleaning}</option>
              <option value="dirty">{t.dirty}</option>
              <option value="do_not_disturb">{t.doNotDisturb}</option>
              <option value="emergency_clean">{t.emergency}</option>
            </select>

            <div className="modal-actions">
              <button className="btn" onClick={() => setShowEditRoom(false)}>
                {t.cancel}
              </button>
              <button
                className="btn red"
                onClick={async () => {
                  if (!window.confirm(`${t.deleteRoomConfirm} ${selectedRoom.room_number}? ${t.cannotBeUndone}`)) {
                    return;
                  }

                  try {
                    const resp = await fetch("/api/admin/deleteRoom/", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        room_id: selectedRoom.id,
                      }),
                    });

                    if (resp.status === 200) {
                      setShowEditRoom(false);
                      alert(language === 'en' ? 'Room deleted successfully' : 'Salle supprimée avec succès');
                      fetchRooms(currentFloor);
                    } else {
                      const error = await resp.json();
                      alert(error.error || (language === 'en' ? "Failed to delete room" : "Échec de la suppression de la salle"));
                    }
                  } catch (err) {
                    console.error("Error deleting room:", err);
                    alert(language === 'en' ? "Failed to delete room" : "Échec de la suppression de la salle");
                  }
                }}
              >
                {t.deleteRoom}
              </button>
              <button
                className="btn primary"
                onClick={async () => {
                  try {
                    const resp = await fetch("/api/admin/editRoom/", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        room_id: selectedRoom.id,
                        status: editStatus,
                      }),
                    });

                    if (resp.status === 200) {
                      setShowEditRoom(false);
                      fetchRooms(currentFloor);
                    } else {
                      let bodyText = null;
                      try {
                        const jb = await resp.json();
                        bodyText = jb.error || JSON.stringify(jb);
                      } catch (e) {
                        try {
                          bodyText = await resp.text();
                        } catch (e2) {
                          bodyText = `HTTP ${resp.status}`;
                        }
                      }
                      console.error("Edit room failed:", resp.status, bodyText);
                      alert(bodyText || (language === 'en' ? "Failed to edit room" : "Échec de la modification de la salle"));
                    }
                  } catch (err) {
                    console.error("Network error:", err);
                    alert(language === 'en' ? "Network error" : "Erreur réseau");
                  }
                }}
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROOM GRID - place rooms by pos_x / pos_y inside this grid */}
      {rooms.length === 0 ? (
        <p className="muted">{t.noRoomsFloor}</p>
      ) : (
        <div
          className="room-grid"
          role="application"
          aria-label="Room placement grid"
          ref={gridRef}
          style={{ ["--scale" as any]: scale }}
        >
          {rooms.map((r) => {
            // store positions as percentages (0-100) where possible
            const left = typeof r.pos_x === "number" && r.pos_x <= 100 ? `${r.pos_x}%` : `${r.pos_x}px`;
            const top = typeof r.pos_y === "number" && r.pos_y <= 100 ? `${r.pos_y}%` : `${r.pos_y}px`;

            return (
              <div
                key={r.id}
                className={`room-node`}
                style={{ left, top }}
                title={`Room ${r.room_number}`}
                onPointerDown={(e) => startDrag(e, r.id)}
              >
                <div 
                  className="room-card" 
                  data-status={r.status}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Don't open modal if user was dragging
                    if (isDraggingRef.current) return;
                    setSelectedRoom(r);
                    setEditStatus(r.status);
                    setShowEditRoom(true);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <h4>{t.room} {r.room_number}</h4>
                  <p>{t.status}: {getStatusLabel(r.status)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
