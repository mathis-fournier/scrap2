import { useState } from 'react';
import AuthScreen from './AuthScreen';
import Dashboard from './Dashboard';
import { useNavigate } from 'react-router-dom';

export default function PanelApp() {
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [role, setRole] = useState(localStorage.getItem('role') || 'user');
  const navigate = useNavigate();

  const handleAuthSuccess = (id, newRole) => {
    setUserId(id);
    setRole(newRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    setUserId(null);
    setRole('user');
    navigate('/login');
  };

  if (!userId) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return <Dashboard userId={userId} role={role} onLogout={handleLogout} />;
}
