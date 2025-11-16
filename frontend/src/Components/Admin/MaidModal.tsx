import { useState, useEffect } from "react";
import { X, ClipboardList, BarChart3 } from "lucide-react";
import { api, Maid, CleaningLog } from "lib/api";
import { MaidStatsModal } from "./MaidStatsModal";

interface MaidModalProps {
  maid: Maid;
  onClose: () => void;
}

export function MaidModal({ maid, onClose }: MaidModalProps) {
  const [cleaningLogs, setCleaningLogs] = useState<CleaningLog[]>([]);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    loadCleaningLogs();
  }, [maid.id]);

  const loadCleaningLogs = async () => {
    try {
      const allLogs = await api.getCleaningLogs();
      const filtered = allLogs.filter((log) => log.maid_id === maid.id);
      setCleaningLogs(filtered);
    } catch (err) {
      console.error("Error loading logs:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">{maid.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* STATUS */}
          <div>
            <label className="block text-sm font-medium text-gray-500">Status</label>
            <p className="text-lg">{maid.status}</p>
          </div>

          {/* CLEANING LOGS */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
              <ClipboardList size={18} />
              Cleaning Logs
            </label>

            {cleaningLogs.length > 0 ? (
              <div className="space-y-2">
                {cleaningLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-900">{log.message ?? "No message"}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No logs for this maid.</p>
            )}
          </div>

          {/* STATS BUTTON */}
          <button
            onClick={() => setShowStats(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <BarChart3 size={18} />
            View Maid Stats
          </button>
        </div>
      </div>

      {showStats && (
        <MaidStatsModal
          maid={maid}
          cleaningLogs={cleaningLogs}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
}
