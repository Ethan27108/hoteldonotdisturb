import React, { useState } from "react";
import { X } from "lucide-react";

interface CreateRoomFormProps {
  onClose: () => void;
  floor_id?: string | null;
  onSubmit: (roomData: {
    room_number: string;
    // backend accepts either floor_id OR floor_number
    floor_id?: string | null;
    floor_number?: string | null;
    pos_x?: string | null;
    pos_y?: string | null;
    status?: string;
    room_type?: string;
  }) => void;
}

const CreateRoomForm = ({ onClose, floor_id = null, onSubmit }: CreateRoomFormProps) => {
  const [roomNumber, setRoomNumber] = useState("");
  const [floorNumber, setFloorNumber] = useState<string>("");
  const [status, setStatus] = useState<string>("Available");
  const [roomType, setRoomType] = useState<string>("Standard");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      room_number: roomNumber,
      status,
      room_type: roomType,
    };

    // prefer explicit floor_id if provided by parent
    if (floor_id) payload.floor_id = floor_id;
    else if (floorNumber) payload.floor_number = floorNumber;

    onSubmit(payload);
    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Create New Room</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          {/* Room Number */}
          <input
            type="text"
            required
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="Room Number (e.g. 101)"
            className="w-full px-3 py-2 border rounded-lg"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', marginTop: '8px', fontSize: '15px' }}
          />

          {/* Floor selection: only show if no floor_id provided */}
          {!floor_id && (
            <input
              type="number"
              required
              value={floorNumber}
              onChange={(e) => setFloorNumber(e.target.value)}
              placeholder="Floor Number (e.g. 1)"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', marginTop: '8px', fontSize: '15px' }}
            />
          )}

          {/* Status */}
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginTop: '12px' }}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', marginTop: '4px', fontSize: '15px' }}
          >
            <option>Available</option>
            <option>Cleaning</option>
            <option>Dirty</option>
            <option>Do Not Disturb</option>
            <option>Emergency</option>
          </select>

          {/* Room Type */}
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginTop: '12px' }}>Room Type</label>
          <input
            type="text"
            required
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            placeholder="Room Type (e.g. Standard, Deluxe, Suite)"
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', marginTop: '4px', fontSize: '15px' }}
          />

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn">
              Cancel
            </button>
            <button type="submit" className="btn primary">
              Create Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomForm;
