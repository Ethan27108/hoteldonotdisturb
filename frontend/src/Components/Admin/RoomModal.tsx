import { useState, useEffect } from "react";
import { X, Battery, User, MessageSquare, Trash2, UserPlus, CheckCircle } from "lucide-react";
import { api, HotelRoom, Maid, CleaningLog } from "lib/api";

interface RoomModalProps {
  room: HotelRoom;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: (roomId: string) => void;
}

export function RoomModal({ room, onClose, onUpdate, onDelete }: RoomModalProps) {
  const [assignedMaid, setAssignedMaid] = useState<Maid | null>(null);
  const [cleaningLogs, setCleaningLogs] = useState<CleaningLog[]>([]);
  const [maids, setMaids] = useState<Maid[]>([]);
  const [selectedMaidId, setSelectedMaidId] = useState("");

  const [showAssign, setShowAssign] = useState(false);

  useEffect(() => {
    loadMaids();
    loadCleaningLogs();
    if (room.assigned_maid_id) loadAssignedMaid();
  }, [room.id]);

  const loadMaids = async () => {
    try {
      const data = await api.getMaids();
      setMaids(data);
    } catch (err) {
      console.error("Error loading maids:", err);
    }
  };

  const loadAssignedMaid = async () => {
    try {
      const data = await api.getMaids();
      const found = data.find((m) => m.id === room.assigned_maid_id);
      setAssignedMaid(found || null);
    } catch (err) {
      console.error("Error loading assigned maid:", err);
    }
  };

  const loadCleaningLogs = async () => {
    try {
      const logs = await api.getCleaningLogs();
      setCleaningLogs(logs.filter((l) => l.room_id === room.id));
    } catch (err) {
      console.error("Error loading logs:", err);
    }
  };

  const handleAssign = async () => {
    if (!selectedMaidId) return;
    try {
      await api.updateRoom(room.id, { assigned_maid_id: selectedMaidId });
      onUpdate();
      loadAssignedMaid();
      setShowAssign(false);
    } catch (err) {
      console.error("Error assigning maid:", err);
    }
  };

  const handleMarkDone = async () => {
    try {
      await api.updateRoom(room.id, { status: "available" });
      onUpdate();
      onClose();
    } catch (err) {
      console.error("Error marking done:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this room?")) return;

    try {
      await api.deleteRoom(room.id);
      onDelete(room.id);
    } catch (err) {
      console.error("Error deleting room:", err);
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return "text-green-600";
    if (level > 20) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Room {room.room_number}</h2>

          <div className="flex gap-3">
            <button
              onClick={handleMarkDone}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg"
            >
              <CheckCircle size={18} /> Done
            </button>

            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">

          {/* Status */}
          <div>
            <label className="text-sm text-gray-500">Status</label>
            <p className="text-lg">{room.status}</p>
          </div>

          {/* Battery */}
          <div>
            <label className="text-sm text-gray-500">Battery</label>
            <div className="flex items-center gap-2 mt-1">
              <Battery className={getBatteryColor(room.battery_level)} size={24} />
              <span className={`font-semibold ${getBatteryColor(room.battery_level)}`}>
                {room.battery_level}%
              </span>
            </div>
          </div>

          {/* Assigned Maid */}
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Assigned Maid</label>

            {assignedMaid ? (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <User size={20} />
                  <span>{assignedMaid.name}</span>
                </div>

                <button
                  onClick={() => {
                    setShowAssign(true);
                    setSelectedMaidId(assignedMaid.id);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAssign(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg"
              >
                Assign Maid
              </button>
            )}

            {showAssign && (
              <div className="mt-3 flex gap-2">
                <select
                  value={selectedMaidId}
                  onChange={(e) => setSelectedMaidId(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2"
                >
                  <option value="">Select a maid</option>
                  {maids.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.status})
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAssign}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Save
                </button>

                <button
                  onClick={() => setShowAssign(false)}
                  className="px-3 py-2 border rounded-lg"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Cleaning Logs */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
              <MessageSquare size={18} />
              Cleaning Logs
            </label>

            {cleaningLogs.length > 0 ? (
              <div className="space-y-2">
                {cleaningLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm">{log.message ?? "No message"}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No cleaning logs.</p>
            )}
          </div>

          {/* Delete Room */}
          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            <Trash2 size={18} />
            Delete Room
          </button>
        </div>
      </div>
    </div>
  );
}
