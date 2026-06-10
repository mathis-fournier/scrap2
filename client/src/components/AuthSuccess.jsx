import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthSuccess() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const userId = params.get('userId');

        if (token && userId) {
            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);
            localStorage.setItem('role', 'user');
            // Redirect to the main dashboard
            navigate('/app');
        } else {
            navigate('/');
        }
    }, [navigate, location]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-emerald-400 font-mono">
            Authenticating...
        </div>
    );
}