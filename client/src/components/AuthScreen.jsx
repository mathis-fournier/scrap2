import { useState } from 'react';
import { Zap } from 'lucide-react';
import { API_URL } from '../services/api';

export default function AuthScreen({ onAuthSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [tosAccepted, setTosAccepted] = useState(false);

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

            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('role', data.role || 'user');
            onAuthSuccess(data.userId, data.role || 'user');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 font-sans text-white bg-neutral-950">
            <div className="w-full max-w-md p-8 border rounded-2xl border-neutral-800 bg-neutral-900/50 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-3 mb-8">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-teal-400 to-teal-600 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
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
        </div>
    );
}
