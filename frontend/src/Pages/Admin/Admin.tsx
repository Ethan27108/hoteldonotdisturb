// src/Pages/Admin/Admin.tsx

import { useState } from "react";
import { Hotel } from "lucide-react";

import { Sidebar } from "../../Components/Admin/Sidebar";
import { AdminDashboard } from "./AdminDashboard";
import { AdminMaidActivity } from "./AdminMaidActivity";

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "maids">("dashboard");

  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* TOP NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <Hotel className="text-blue-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-900">
              Hotel Layout Manager
            </h1>
          </div>
        </div>
      </nav>

      {/* LEFT SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as "dashboard" | "maids")}
      />

      {/* MAIN CONTENT */}
      <div className="ml-64 pt-16">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "dashboard" && <AdminDashboard />}
          {activeTab === "maids" && <AdminMaidActivity />}
        </div>
      </div>

    </div>
  );
};

export default Admin;
