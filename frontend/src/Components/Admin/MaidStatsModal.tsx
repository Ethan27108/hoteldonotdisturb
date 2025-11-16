import {
  X,
  TrendingUp,
  CheckCircle,
  Clock,
  Calendar,
  Briefcase,
  Activity,
  Battery,
} from "lucide-react";
import { Maid, CleaningLog } from "lib/api";

interface MaidStatsModalProps {
  maid: Maid;
  cleaningLogs: CleaningLog[];
  onClose: () => void;
}

export function MaidStatsModal({ maid, cleaningLogs, onClose }: MaidStatsModalProps) {
  const totalRoomsCleaned = cleaningLogs.length;

  const roomsByType: Record<string, number> = {};
  cleaningLogs.forEach((log) => {
    if (log.hotel_room?.room_type) {
      const type = log.hotel_room.room_type;
      roomsByType[type] = (roomsByType[type] || 0) + 1;
    }
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">

        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Stats for {maid.name}</h2>
          <button onClick={onClose}>
            <X size={22} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Total Rooms Cleaned */}
          <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
            <span className="text-lg font-semibold">{totalRoomsCleaned}</span>
            <span className="text-gray-600">Total Rooms Cleaned</span>
            <CheckCircle className="text-green-600" />
          </div>

          {/* Rooms by Type */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp size={18} />
              Rooms Cleaned by Type
            </h3>

            {Object.keys(roomsByType).length > 0 ? (
              Object.entries(roomsByType).map(([type, count]) => (
                <div key={type} className="flex justify-between border-b py-2">
                  <span>{type}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No room type data available.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
