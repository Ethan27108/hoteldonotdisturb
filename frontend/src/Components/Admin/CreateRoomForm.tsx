import React, { useState } from "react";
import { X } from "lucide-react";

interface CreateRoomFormProps {
  onClose: () => void;
  floor_id: string;
  onSubmit: (roomData: {
    room_number: string;
    room_type: string;
    status: string;
    floor_id: string;
  }) => void;
}

const CreateRoomForm = ({ onClose, floor_id, onSubmit }: CreateRoomFormProps) => {
  const [formData, setFormData] = useState({
    room_number: "",
    room_type: "Standard",
    status: "available",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, floor_id });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Create New Room</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            type="text"
            required
            value={formData.room_number}
            onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
            placeholder="101"
            className="w-full px-3 py-2 border rounded-lg"
          />

          <select
            value={formData.room_type}
            onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option>Standard</option>
            <option>Deluxe</option>
            <option>Suite</option>
          </select>

          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 border p-2 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg">
              Create Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomForm;
