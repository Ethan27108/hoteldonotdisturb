import React from "react";
import { X } from "lucide-react";

interface RoomModalProps {
  room: {
    room_number: string;
    room_type: string;
    status: string;
  };
  onClose: () => void;
}

const RoomModal = ({ room, onClose }: RoomModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Room {room.room_number}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-2">
          <p><strong>Type:</strong> {room.room_type}</p>
          <p><strong>Status:</strong> {room.status}</p>
        </div>
      </div>
    </div>
  );
};

export default RoomModal;
