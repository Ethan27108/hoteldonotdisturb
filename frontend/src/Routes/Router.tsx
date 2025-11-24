import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../Pages/Login';
import Dashboard from '../Pages/Dashboard';
import ProfileMaid from 'Pages/ProfileMaid';
import Admin from 'Pages/Admin/Admin';
import AlgoForce from 'Pages/algoForce';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/ProfileMaid" element={<ProfileMaid />}/>
        <Route path="/admin" element={<Admin />} />
        <Route path="/algoForce" element={<AlgoForce />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;