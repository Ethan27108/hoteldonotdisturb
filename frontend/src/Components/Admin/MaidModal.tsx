import React from "react";
import { X } from "lucide-react";

interface MaidModalProps {
  maid: {
    name: string;
    status: string;
    floor?: string;
    room?: string;
  };
  onClose: () => void;
}

const MaidModal = ({ maid, onClose }: MaidModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{maid.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-2">
          <p><strong>Status:</strong> {maid.status}</p>
          {maid.floor && <p><strong>Floor:</strong> {maid.floor}</p>}
          {maid.room && <p><strong>Room:</strong> {maid.room}</p>}
        </div>
      </div>
    </div>
  );
};

export default MaidModal;
