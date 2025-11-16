// src/Pages/Admin/AdminMaidActivity.tsx
import { useState, useEffect } from 'react';
import { Plus, User, MessageSquare } from 'lucide-react';
import { api, Maid } from 'lib/api';
import { CreateMaidForm } from 'Components/Admin/CreateMaidForm';
import { MaidModal } from 'Components/Admin/MaidModal';

export function AdminMaidActivity() {
  const [maids, setMaids] = useState<Maid[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMaid, setSelectedMaid] = useState<Maid | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaids();
  }, []);

  const loadMaids = async () => {
    try {
      const data = await api.getMaids();
      if (data) {
        setMaids(data);
      }
    } catch (error) {
      console.error('Error loading maids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaid = async (maidData: { name: string }) => {
    try {
      const data = await api.createMaid(maidData.name);
      if (data) {
        setMaids([data, ...maids]);
      }
    } catch (error) {
      console.error('Error creating maid:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      case 'On Break':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading maids...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* JSX same as your existing MaidActivity component */}
    </div>
  );
}

export default AdminMaidActivity;
