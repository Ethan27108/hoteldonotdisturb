import React, { useState } from "react";
import { X } from "lucide-react";

const translations = {
  en: {
    createNewRoom: 'Create New Room',
    roomNumber: 'Room Number (e.g. 101)',
    floorNumber: 'Floor Number (e.g. 1)',
    status: 'Status',
    available: 'Available',
    cleaning: 'Cleaning',
    dirty: 'Dirty',
    doNotDisturb: 'Do Not Disturb',
    emergency: 'Emergency',
    cancel: 'Cancel',
    createRoom: 'Create Room',
  },
  fr: {
    createNewRoom: 'Créer une nouvelle salle',
    roomNumber: 'Numéro de salle (par ex. 101)',
    floorNumber: 'Numéro d\'étage (par ex. 1)',
    status: 'Statut',
    available: 'Disponible',
    cleaning: 'Nettoyage',
    dirty: 'Sale',
    doNotDisturb: 'Ne pas déranger',
    emergency: 'Urgence',
    cancel: 'Annuler',
    createRoom: 'Créer une salle',
  },
}

interface CreateRoomFormProps {
  onClose: () => void;
  floor_id?: string | null;
  language: 'en' | 'fr';
  onSubmit: (roomData: {
    room_number: string;
    floor_id?: string | null;
    floor_number?: string | null;
    pos_x?: string | null;
    pos_y?: string | null;
    status?: string;
  }) => void;
}

const CreateRoomForm = ({ onClose, floor_id = null, language, onSubmit }: CreateRoomFormProps) => {
  const t = translations[language]
  const [roomNumber, setRoomNumber] = useState("");
  const [floorNumber, setFloorNumber] = useState<string>("");
  const [status, setStatus] = useState<string>("Available");
  const [roomType, setRoomType] = useState<string>("Standard");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      room_number: roomNumber,
      status,
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
          <h3 style={{ margin: 0 }}>{t.createNewRoom}</h3>
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
            placeholder={t.roomNumber}
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
              placeholder={t.floorNumber}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', marginTop: '8px', fontSize: '15px' }}
            />
          )}

          {/* Status */}
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginTop: '12px' }}>{t.status}</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', marginTop: '4px', fontSize: '15px' }}
          >
            <option>{t.available}</option>
            <option>{t.cleaning}</option>
            <option>{t.dirty}</option>
            <option>{t.doNotDisturb}</option>
            <option>{t.emergency}</option>
          </select>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn">
              {t.cancel}
            </button>
            <button type="submit" className="btn primary">
              {t.createRoom}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomForm;
