import { useState } from 'react';
import { Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../services/api';

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [tosAccepted, setTosAccepted] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isLogin && !tosAccepted) {
            return setError('You must accept the Terms of Service to register.');
        }

        const endpoint = isLogin ? '/api/login' : '/api/register';

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // Store credentials
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('role', data.role || 'user');

            navigate('/app');

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 font-sans text-white bg-neutral-950">
            <div className="w-full max-w-md overflow-hidden border rounded-2xl border-neutral-800 bg-neutral-900/50 backdrop-blur-xl">
                <div className="p-8">
                    <div className="flex flex-col items-center gap-3 mb-8">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                            <Zap className="w-6 h-6 text-white fill-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-wide">Finder<span className="text-teal-500">Pro</span></h1>
                        <p className="text-sm text-neutral-400">{isLogin ? 'Welcome back' : 'Create your account'}</p>
                    </div>

                    {error && <div className="p-3 mb-4 text-sm text-red-400 bg-red-500/10 rounded-xl">{error}</div>}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-neutral-400">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 text-white border rounded-xl border-neutral-700 bg-neutral-950 focus:border-teal-500 focus:outline-none" required />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-neutral-400">Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 text-white border rounded-xl border-neutral-700 bg-neutral-950 focus:border-teal-500 focus:outline-none" required />
                        </div>

                        {!isLogin && (
                            <div className="flex items-start gap-3 mt-2">
                                <input type="checkbox" id="tos" checked={tosAccepted} onChange={(e) => setTosAccepted(e.target.checked)} className="mt-1 accent-teal-500" />
                                <label htmlFor="tos" className="text-xs leading-relaxed text-neutral-400">
                                    I understand this tool automates requests. I am using a secondary account. FinderPro is not responsible for any account bans.
                                </label>
                            </div>
                        )}

                        <button type="submit" className="w-full py-3 mt-2 font-medium text-white transition-colors bg-teal-600 rounded-xl hover:bg-teal-500">
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </button>
                    </form>

                    <button onClick={() => { setIsLogin(!isLogin); setError(''); setTosAccepted(false); }} className="w-full mt-4 text-sm text-center transition-colors text-neutral-500 hover:text-white">
                        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                    </button>
                </div>

                <div className="px-8 py-4 border-t bg-neutral-800/20 border-neutral-800">
                    <p className="mb-4 text-xs text-center text-neutral-500">Or continue with</p>
                    <a
                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/discord`}
                        className="flex items-center justify-center w-full px-4 py-3 font-medium text-white transition-all duration-200 rounded-xl bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#6B78FF] hover:to-[#5B62D8] shadow-lg hover:shadow-[0_0_20px_rgba(88,101,242,0.4)]"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 shrink-0 mr-3"
                            style={{ minWidth: '24px', minHeight: '24px' }}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.8189.0992 18.5323a.0611.0611 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                        </svg>
                        <span>Discord</span>
                    </a>
                </div>
            </div>
        </div>
    );
}