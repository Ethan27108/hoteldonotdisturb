import React, { useState } from "react";
import { X } from "lucide-react";

const translations = {
  en: {
    addNewMaid: 'Add New Maid',
    username: 'Username',
    usernameRequired: 'Username *',
    password: 'Password',
    passwordRequired: 'Password *',
    email: 'Email',
    emailRequired: 'Email *',
    fullName: 'Full Name',
    fullNameRequired: 'Full Name *',
    profileInfo: 'Profile Info',
    shiftDays: 'Shift Days',
    shiftStartTime: 'Shift Start Time',
    shiftEndTime: 'Shift End Time',
    breakMinutes: 'Break Minutes',
    cancel: 'Cancel',
    addMaid: 'Add Maid',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
  },
  fr: {
    addNewMaid: 'Ajouter une nouvelle femme de chambre',
    username: 'Nom d\'utilisateur',
    usernameRequired: 'Nom d\'utilisateur *',
    password: 'Mot de passe',
    passwordRequired: 'Mot de passe *',
    email: 'Email',
    emailRequired: 'Email *',
    fullName: 'Nom complet',
    fullNameRequired: 'Nom complet *',
    profileInfo: 'Informations du profil',
    shiftDays: 'Jours de travail',
    shiftStartTime: 'Heure de début du quart',
    shiftEndTime: 'Heure de fin du quart',
    breakMinutes: 'Minutes de pause',
    cancel: 'Annuler',
    addMaid: 'Ajouter une femme de chambre',
    mon: 'Lun',
    tue: 'Mar',
    wed: 'Mer',
    thu: 'Jeu',
    fri: 'Ven',
    sat: 'Sam',
    sun: 'Dim',
  },
}

interface CreateMaidFormProps {
  onClose: () => void;
  language: 'en' | 'fr';
  onSubmit: (data: {
    username: string;
    password: string;
    email: string;
    name: string;
    profile_info?: string;
    shift_days?: string[];
    shift_start_time?: string;
    shift_end_time?: string;
    break_minutes?: number;
  }) => void;
}

const CreateMaidForm = ({ onClose, language, onSubmit }: CreateMaidFormProps) => {
  const t = translations[language]
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    name: "",
    profile_info: "",
    shift_days: [] as string[],
    shift_start_time: "",
    shift_end_time: "",
    break_minutes: 0,
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

  const days = [
    { code: 'Mon', label: t.mon },
    { code: 'Tue', label: t.tue },
    { code: 'Wed', label: t.wed },
    { code: 'Thu', label: t.thu },
    { code: 'Fri', label: t.fri },
    { code: 'Sat', label: t.sat },
    { code: 'Sun', label: t.sun },
  ];

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>{t.addNewMaid}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t.usernameRequired}</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              placeholder={t.username}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t.passwordRequired}</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              placeholder={t.password}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t.emailRequired}</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              placeholder="maid@hotel.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t.fullNameRequired}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t.profileInfo}</label>
            <textarea
              value={formData.profile_info}
              onChange={(e) => setFormData({ ...formData, profile_info: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, minHeight: 60 }}
              placeholder={language === 'en' ? "Additional information..." : "Informations supplémentaires..."}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t.shiftDays}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {days.map((day) => (
                <button
                  key={day.code}
                  type="button"
                  onClick={() => handleDayToggle(day.code)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    background: formData.shift_days.includes(day.code) ? '#3b82f6' : '#fff',
                    color: formData.shift_days.includes(day.code) ? '#fff' : '#374151',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t.shiftStartTime}</label>
              <input
                type="time"
                value={formData.shift_start_time}
                onChange={(e) => setFormData({ ...formData, shift_start_time: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t.shiftEndTime}</label>
              <input
                type="time"
                value={formData.shift_end_time}
                onChange={(e) => setFormData({ ...formData, shift_end_time: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t.breakMinutes}</label>
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
              {t.cancel}
            </button>
            <button type="submit" className="btn primary">
              {t.addMaid}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMaidForm;
