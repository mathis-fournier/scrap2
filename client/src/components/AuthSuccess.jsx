import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setTokens } from '../services/api';
import useStore from '../store/useStore';

export default function AuthSuccess() {
    const navigate = useNavigate();
    const location = useLocation();
    const setAuthUser = useStore(state => state.setAuthUser);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const userId = params.get('userId');

        if (accessToken && refreshToken && userId) {
            // Store both tokens
            setTokens(accessToken, refreshToken);
            localStorage.setItem('userId', userId);
            localStorage.setItem('role', 'user');

            // Set auth state in store
            setAuthUser(userId, 'user');

            // Redirect to the main dashboard
            navigate('/app');
        } else {
            navigate('/');
        }
    }, [navigate, location, setAuthUser]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-emerald-400 font-mono">
            Authenticating...
        </div>
    );
}