// src/Pages/Admin/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Trash2,
  Layers,
  ChevronDown,
} from "lucide-react";

import { api, HotelRoom, Floor } from "lib/api";
import { CreateRoomForm } from "../../Components/Admin/CreateRoomForm";
import { RoomModal } from "../../Components/Admin/RoomModal";

/* -----------------------------------------------------
   CONFIG
----------------------------------------------------- */
const BASE_GRID = 60;
const GRID_COLS = 20;
const GRID_ROWS = 10;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;

/* -----------------------------------------------------
   COMPONENT
----------------------------------------------------- */
export function AdminDashboard() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [currentFloor, setCurrentFloor] = useState<Floor | null>(null);

  const [showRoomForm, setShowRoomForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);

  const [draggedRoom, setDraggedRoom] = useState<HotelRoom | null>(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);

  const gridSize = BASE_GRID * zoom;

  /* -----------------------------------------------------
      LOAD FLOORS & ROOMS
  ----------------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const f = await api.getFloors();
        setFloors(f);
        setCurrentFloor(f[0] || null);
      } catch (e) {
        console.error("Error loading floors:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!currentFloor) return;
    loadRooms();
  }, [currentFloor]);

  const loadRooms = async () => {
    try {
      const r = await api.getRooms(currentFloor!.id);
      setRooms(r);
    } catch (e) {
      console.error("Error loading rooms:", e);
    }
  };

  /* -----------------------------------------------------
      FLOOR HANDLERS
  ----------------------------------------------------- */
  const createFloor = async () => {
    const nextNumber =
      floors.length > 0
        ? Math.max(...floors.map((f) => f.floor_number)) + 1
        : 1;

    try {
      const newFloor = await api.createFloor(`Floor ${nextNumber}`, nextNumber);
      setFloors([...floors, newFloor]);
      setCurrentFloor(newFloor);
    } catch (e) {
      console.error("Error creating floor:", e);
    }
  };

  const deleteFloor = async (id: string) => {
    if (!window.confirm("Delete this floor? All rooms will also be deleted.")) return;

    try {
      await api.deleteFloor(id);

      const updated = floors.filter((f) => f.id !== id);
      setFloors(updated);
      setCurrentFloor(updated[0] || null);

      if (updated.length === 0) setRooms([]);
    } catch (e) {
      console.error("Error deleting floor:", e);
    }
  };

  /* -----------------------------------------------------
      ROOM CREATION
  ----------------------------------------------------- */
  const createRoom = async (roomData: any) => {
    if (!currentFloor) return;

    let gx = 0,
      gy = 0;

    outer: for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        const exists = rooms.some((r) => r.grid_x === x && r.grid_y === y);
        if (!exists) {
          gx = x;
          gy = y;
          break outer;
        }
      }
    }

    try {
      const newRoom = await api.createRoom({
        ...roomData,
        grid_x: gx,
        grid_y: gy,
        floor_id: currentFloor.id,
      });

      setRooms([...rooms, newRoom]);
    } catch (e) {
      console.error("Error creating room:", e);
    }
  };

  const deleteRoomLocal = (roomId: string) => {
    setRooms(rooms.filter((r) => r.id !== roomId));
    setSelectedRoom(null);
  };

  /* -----------------------------------------------------
      DRAG & DROP
  ----------------------------------------------------- */
  const startDrag = (room: HotelRoom) => setDraggedRoom(room);
  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  const dropRoom = async (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    if (!draggedRoom) return;

    const occupied = rooms.some(
      (r) => r.id !== draggedRoom.id && r.grid_x === x && r.grid_y === y
    );
    if (occupied) return;

    try {
      await api.updateRoom(draggedRoom.id, { grid_x: x, grid_y: y });

      setRooms(
        rooms.map((r) =>
          r.id === draggedRoom.id ? { ...r, grid_x: x, grid_y: y } : r
        )
      );
    } catch (e) {
      console.error("Error moving room:", e);
    }

    setDraggedRoom(null);
  };

  /* -----------------------------------------------------
      ZOOM
  ----------------------------------------------------- */
  const zoomIn = () => setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX));
  const zoomOut = () => setZoom((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN));

  /* -----------------------------------------------------
      STATUS COLORS
  ----------------------------------------------------- */
  const statusColor = {
    Available: "bg-green-500",
    Occupied: "bg-red-500",
    Maintenance: "bg-yellow-500",
  };

  /* -----------------------------------------------------
      LOADING
  ----------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  /* -----------------------------------------------------
      RENDER
  ----------------------------------------------------- */
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Manage floors, rooms, and layout visually
          </p>
        </div>

        <div className="flex gap-3">

          {/* ZOOM BUTTONS */}
          <button onClick={zoomOut} className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300">
            <ZoomOut size={20} />
          </button>

          <button onClick={zoomIn} className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300">
            <ZoomIn size={20} />
          </button>

          {/* -----------------------------------------------------
               ADD ROOM BUTTON (STEP 1 DEBUGGING)
          ----------------------------------------------------- */}
          <button
            onClick={() => {
              console.log("🔥 Add Room button WAS CLICKED! Opening modal...");
              alert("Add Room button clicked!");
              setShowRoomForm(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} />
            Add Room
          </button>

          {/* NEW FLOOR BUTTON */}
          <button
            onClick={createFloor}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Layers size={18} />
            New Floor
          </button>

        </div>
      </div>

      {/* FLOOR SELECT */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <select
            value={currentFloor?.id || ""}
            onChange={(e) =>
              setCurrentFloor(
                floors.find((fl) => fl.id === e.target.value) || null
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm cursor-pointer pr-10"
          >
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                Floor {floor.floor_number}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
        </div>

        {currentFloor && (
          <button
            onClick={() => deleteFloor(currentFloor.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete Floor
          </button>
        )}
      </div>

      {/* GRID DISPLAY */}
      <div className="relative w-full overflow-auto border rounded-lg bg-gray-50 shadow-inner p-4">
        <div
          className="relative mx-auto"
          style={{
            width: GRID_COLS * gridSize,
            height: GRID_ROWS * gridSize,
            backgroundSize: `${gridSize}px ${gridSize}px`,
            backgroundImage:
              "linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)",
          }}
        >
          {Array.from({ length: GRID_ROWS }).map((_, y) =>
            Array.from({ length: GRID_COLS }).map((_, x) => (
              <div
                key={`${x}-${y}`}
                className="absolute"
                onDragOver={allowDrop}
                onDrop={(e) => dropRoom(e, x, y)}
                style={{
                  left: x * gridSize,
                  top: y * gridSize,
                  width: gridSize,
                  height: gridSize,
                }}
              />
            ))
          )}

          {rooms.map((room) => (
            <div
              key={room.id}
              draggable
              onDragStart={() => startDrag(room)}
              onClick={() => setSelectedRoom(room)}
              className="absolute cursor-pointer rounded-lg shadow-md text-white flex items-center justify-center transition-transform hover:scale-105"
              style={{
                backgroundColor:
                  statusColor[room.status as keyof typeof statusColor] ||
                  "#6b7280",
                width: gridSize - 8,
                height: gridSize - 8,
                left: room.grid_x * gridSize + 4,
                top: room.grid_y * gridSize + 4,
                fontSize: Math.max(12 * zoom, 10),
              }}
            >
              {room.room_number}
            </div>
          ))}
        </div>
      </div>

      {/* MODALS */}
      {showRoomForm && currentFloor && (
        <CreateRoomForm
          onClose={() => setShowRoomForm(false)}
          floor_id={currentFloor.id}
          onSubmit={createRoom}
        />
      )}

      {selectedRoom && (
        <RoomModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onUpdate={loadRooms}
          onDelete={deleteRoomLocal}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
