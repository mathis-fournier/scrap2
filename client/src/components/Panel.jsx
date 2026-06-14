import { useEffect, useState } from 'react';
import AuthScreen from './AuthScreen';
import Dashboard from './Dashboard';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { clearTokens } from '../services/api';

export default function PanelApp() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const userId = useStore(state => state.userId);
  const role = useStore(state => state.role);
  const logout = useStore(state => state.logout);
  const setAuthUser = useStore(state => state.setAuthUser);

  useEffect(() => {
    // Check if user has valid tokens
    const storedUserId = localStorage.getItem('userId');
    const storedRole = localStorage.getItem('role');
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (storedUserId && accessToken && refreshToken) {
      // Set auth user in store
      setAuthUser(storedUserId, storedRole || 'user');
    } else if (storedUserId && !accessToken) {
      // User is stored but no tokens - clear session
      clearTokens();
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
    }

    setIsLoading(false);
  }, [setAuthUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
        <div className="text-white font-mono">Loading...</div>
      </div>
    );
  }

  if (!userId) {
    return <AuthScreen />;
  }

  return <Dashboard userId={userId} role={role} onLogout={handleLogout} />;
}
