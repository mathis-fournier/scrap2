import { useState } from 'react';
import AuthScreen from './AuthScreen';
import Dashboard from './Dashboard';

export default function PanelApp() {
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [role, setRole] = useState(localStorage.getItem('role') || 'user');

  const handleAuthSuccess = (id, newRole) => {
    setUserId(id);
    setRole(newRole);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUserId(null);
    setRole('user');
  };

  if (!userId) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return <Dashboard userId={userId} role={role} onLogout={handleLogout} />;
}
