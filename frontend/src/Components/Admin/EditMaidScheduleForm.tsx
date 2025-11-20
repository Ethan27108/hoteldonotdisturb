import React, { useState } from "react";
import { X } from "lucide-react";

interface EditMaidScheduleFormProps {
  onClose: () => void;
  maidId: string;
  maidName: string;
  initialData: {
    shift_days?: string[];
    shift_start_time?: string;
    shift_end_time?: string;
    break_minutes?: number;
  };
  onSubmit: (data: {
    shift_days?: string[];
    shift_start_time?: string;
    shift_end_time?: string;
    break_minutes?: number;
  }) => void;
}

const EditMaidScheduleForm = ({ onClose, maidId, maidName, initialData, onSubmit }: EditMaidScheduleFormProps) => {
  const [formData, setFormData] = useState({
    shift_days: initialData.shift_days || [],
    shift_start_time: initialData.shift_start_time || "",
    shift_end_time: initialData.shift_end_time || "",
    break_minutes: initialData.break_minutes || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      shift_days: prev.shift_days.includes(day)
        ? prev.shift_days.filter((d) => d !== day)
        : [...prev.shift_days, day],
    }));
  };

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Edit Schedule — {maidName}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Shift Days</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    background: formData.shift_days.includes(day) ? '#3b82f6' : '#fff',
                    color: formData.shift_days.includes(day) ? '#fff' : '#374151',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Shift Start Time</label>
              <input
                type="time"
                value={formData.shift_start_time}
                onChange={(e) => setFormData({ ...formData, shift_start_time: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Shift End Time</label>
              <input
                type="time"
                value={formData.shift_end_time}
                onChange={(e) => setFormData({ ...formData, shift_end_time: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Break Minutes</label>
            <input
              type="number"
              min="0"
              value={formData.break_minutes}
              onChange={(e) => setFormData({ ...formData, break_minutes: parseInt(e.target.value) || 0 })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              placeholder="30"
            />
          </div>

          <div className="modal-actions" style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn">
              Cancel
            </button>
            <button type="submit" className="btn primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMaidScheduleForm;
