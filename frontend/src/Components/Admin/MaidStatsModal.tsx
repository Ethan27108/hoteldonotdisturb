import React from "react";
import { X } from "lucide-react";

interface MaidStatsModalProps {
  stats: {
    totalMaids: number;
    available: number;
    busy: number;
  };
  onClose: () => void;
}

const MaidStatsModal = ({ stats, onClose }: MaidStatsModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Maid Statistics</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-2">
          <p><strong>Total Maids:</strong> {stats.totalMaids}</p>
          <p><strong>Available:</strong> {stats.available}</p>
          <p><strong>Busy:</strong> {stats.busy}</p>
        </div>
      </div>
    </div>
  );
};

export default MaidStatsModal;
