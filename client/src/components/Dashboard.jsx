import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Package, Tag, Globe, Settings, Zap, Menu, X, Trash2, ShieldCheck, Users, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { ItemCard } from './ItemCards';
import TrackerSettings from './TrackerSettings';
import useStore from '../store/useStore';
import { API_URL, getAuthHeaders } from '../services/api';

export default function Dashboard({ userId, role, onLogout }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Vinted');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Local state reserved purely for Admin Panel
    const [adminStats, setAdminStats] = useState({ users: 0, keywords: 0, items: 0 });
    const [adminUsers, setAdminUsers] = useState([]);
    const [nextScanInSeconds, setNextScanInSeconds] = useState(0);

    // Global State hooks via Zustand
    const { items, cookieDead, initializeSocket, disconnectSocket, fetchInitialData } = useStore();

    const platforms = [
        { name: 'Vinted', icon: ShoppingBag },
        { name: 'Leboncoin', icon: Package },
        { name: 'Ebay', icon: Tag },
        { name: 'Others', icon: Globe },
    ];

    // 1. Initialize Global Data & Sockets
    useEffect(() => {
        if (userId) {
            fetchInitialData(userId);
            initializeSocket(userId);
        }
        return () => disconnectSocket();
    }, [userId, fetchInitialData, initializeSocket, disconnectSocket]);

    // 2. Fetch Admin Data (only when tab is active)
    useEffect(() => {
        if (activeTab === 'AdminPanel' && role === 'admin') {
            const fetchAdminData = async () => {
                try {
                    const statsRes = await fetch(`${API_URL}/api/admin/stats?adminId=${userId}`, { headers: getAuthHeaders() });
                    setAdminStats(await statsRes.json());

                    const usersRes = await fetch(`${API_URL}/api/admin/users?adminId=${userId}`, { headers: getAuthHeaders() });
                    setAdminUsers(await usersRes.json());
                } catch (err) {
                    toast.error('Failed to load system stats.');
                }
            };
            fetchAdminData();
        }
    }, [activeTab, userId, role]);

    useEffect(() => {
        const SCAN_INTERVAL_SECONDS = 20;

        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            const secondsUntilNext = SCAN_INTERVAL_SECONDS - (now % SCAN_INTERVAL_SECONDS);
            setNextScanInSeconds(secondsUntilNext === 0 ? SCAN_INTERVAL_SECONDS : secondsUntilNext);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    const deleteUser = async (targetId) => {
        if (!window.confirm('Are you sure? This deletes the user and all their history permanently.')) return;

        const toastId = toast.loading('Deleting user...');
        try {
            const res = await fetch(`${API_URL}/api/admin/users/${targetId}?adminId=${userId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (res.ok) {
                setAdminUsers(prev => prev.filter(u => u.id !== targetId));
                toast.success('User deleted permanently.', { id: toastId });
            } else {
                toast.error('Failed to delete user.', { id: toastId });
            }
        } catch (err) {
            toast.error('Network error during deletion.', { id: toastId });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        if (onLogout) onLogout();
        navigate('/login');
    };

    const filteredItems = items.filter(item => item.platform === activeTab);

    return (
        <div className="flex w-full h-screen overflow-hidden font-sans text-neutral-200 bg-neutral-950">
            {/* Mobile Nav Header */}
            <div className="fixed top-0 z-50 flex items-center justify-between w-full px-4 py-3 border-b md:hidden border-neutral-800 bg-neutral-900/90 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-500" />
                    <span className="font-bold text-white tracking-wide">gratte.sh</span>
                </div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-neutral-400 bg-neutral-800/50 rounded-lg">
                    {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col border-r border-neutral-800 bg-neutral-900/95 backdrop-blur-xl transition-transform duration-300 md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="items-center justify-between hidden h-16 px-6 border-b md:flex border-neutral-800/60 md:h-20">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.25)] md:h-10 md:w-10">
                            <Zap className="w-5 h-5 text-white fill-white" />
                        </div>
                        <span className="text-xl font-bold tracking-wide text-white">gratte<span className="text-indigo-400">.sh</span></span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar">
                    <div className="px-3 mb-3 text-xs font-semibold tracking-wider uppercase text-neutral-500">Monitors</div>
                    <ul className="space-y-1">
                        {platforms.map((platform) => (
                            <li key={platform.name}>
                                <button onClick={() => { setActiveTab(platform.name); setIsSidebarOpen(false); }} className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${activeTab === platform.name ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
                                    <platform.icon className={`w-5 h-5 ${activeTab === platform.name ? 'text-indigo-400' : 'text-neutral-500'}`} /> {platform.name}
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="px-3 mt-8 mb-3 text-xs font-semibold tracking-wider uppercase text-neutral-500">System</div>
                    <ul className="space-y-1">
                        <li>
                            <button onClick={() => { setActiveTab('Settings'); setIsSidebarOpen(false); }} className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${activeTab === 'Settings' ? 'bg-teal-500/10 text-teal-400' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
                                <Settings className={`w-5 h-5 ${activeTab === 'Settings' ? 'text-teal-400' : 'text-neutral-500'}`} /> Tracker Settings
                            </button>
                        </li>

                        {role === 'admin' && (
                            <li>
                                <button onClick={() => { setActiveTab('AdminPanel'); setIsSidebarOpen(false); }} className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${activeTab === 'AdminPanel' ? 'bg-purple-500/10 text-purple-400' : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'}`}>
                                    <ShieldCheck className={`w-5 h-5 ${activeTab === 'AdminPanel' ? 'text-purple-400' : 'text-neutral-500'}`} /> Admin Panel
                                </button>
                            </li>
                        )}
                    </ul>
                </nav>

                <div className="p-4 border-t border-neutral-800/60">
                    <button onClick={handleLogout} className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-semibold text-neutral-400 transition-colors border rounded-xl border-neutral-800 bg-neutral-900 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20">
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 pt-20 overflow-y-auto md:p-8 md:pt-8 bg-neutral-950">

                {/* Global Cookie Warning */}
                {cookieDead && activeTab !== 'AdminPanel' && activeTab !== 'Settings' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 mb-8 border rounded-xl border-red-500/50 bg-red-500/10">
                        <div className="flex items-center gap-3 text-red-400 font-medium">
                            <ShieldCheck className="w-5 h-5 shrink-0" />
                            <span>Scanning Halted: Your Vinted session cookie is missing or has expired.</span>
                        </div>
                        <button onClick={() => setActiveTab('Settings')} className="px-5 py-2.5 text-sm font-semibold text-white transition-colors bg-red-500/80 rounded-lg hover:bg-red-500 whitespace-nowrap">
                            Update Configuration
                        </button>
                    </div>
                )}

                <header className="flex flex-col justify-between mb-8 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                            {activeTab === 'Settings' ? 'Tracker Settings' : activeTab === 'AdminPanel' ? 'System Overview' : `${activeTab} Monitor`}
                        </h1>
                        <p className="text-sm text-neutral-400 mt-1">
                            {activeTab === 'Settings' ? 'Configure your endpoints and keywords.' : activeTab === 'AdminPanel' ? 'Platform health and user metrics.' : `Viewing incoming drops for ${activeTab}.`}
                        </p>
                    </div>

                    {/* Hide Scan timer on settings/admin pages */}
                    {(activeTab !== 'Settings' && activeTab !== 'AdminPanel') && (
                        <div className="mt-4 sm:mt-0">
                            <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full text-neutral-300 bg-neutral-900 border border-neutral-800 shadow-sm">
                                <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                                <span className="text-neutral-500">Next scan in</span>
                                <span className="font-semibold text-white">{Math.floor(nextScanInSeconds / 60)}:{String(nextScanInSeconds % 60).padStart(2, '0')}</span>
                            </span>
                        </div>
                    )}
                </header>

                {/* Sub-components Routing */}
                {activeTab === 'AdminPanel' ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="p-6 border rounded-2xl border-neutral-800 bg-neutral-900/40">
                                <div className="flex items-center gap-3 mb-3 text-neutral-400"><Users className="w-5 h-5 text-blue-400" /> Total Users</div>
                                <div className="text-3xl font-bold text-white">{adminStats.users}</div>
                            </div>
                            <div className="p-6 border rounded-2xl border-neutral-800 bg-neutral-900/40">
                                <div className="flex items-center gap-3 mb-3 text-neutral-400"><Activity className="w-5 h-5 text-indigo-400" /> Active Trackers</div>
                                <div className="text-3xl font-bold text-white">{adminStats.keywords}</div>
                            </div>
                            <div className="p-6 border rounded-2xl border-neutral-800 bg-neutral-900/40">
                                <div className="flex items-center gap-3 mb-3 text-neutral-400"><Package className="w-5 h-5 text-emerald-400" /> Items Scraped</div>
                                <div className="text-3xl font-bold text-white">{adminStats.items}</div>
                            </div>
                        </div>

                        <div className="overflow-hidden border rounded-2xl border-neutral-800 bg-neutral-900/40">
                            <div className="p-6 border-b border-neutral-800">
                                <h2 className="text-lg font-semibold text-white">Registered Accounts</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-neutral-400">
                                    <thead className="text-xs uppercase bg-neutral-950/50 text-neutral-500 border-b border-neutral-800/60">
                                        <tr>
                                            <th className="px-6 py-4 font-medium tracking-wider">Email</th>
                                            <th className="px-6 py-4 font-medium tracking-wider">Role</th>
                                            <th className="px-6 py-4 font-medium tracking-wider">Proxy Setup</th>
                                            <th className="px-6 py-4 font-medium tracking-wider">Cookie Health</th>
                                            <th className="px-6 py-4 font-medium tracking-wider">Trackers</th>
                                            <th className="px-6 py-4 font-medium tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800/60">
                                        {adminUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-neutral-800/20 transition-colors">
                                                <td className="px-6 py-4 font-medium text-white">{user.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' : 'bg-neutral-800 border border-neutral-700 text-neutral-300'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">{user.proxy_url ? '✅ Assigned' : '❌ None'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${user.cookie_status === 'Active' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                                                        {user.cookie_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium">{user.keyword_count}</td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => deleteUser(user.id)} disabled={user.role === 'admin'} className="p-2 transition-colors rounded-lg disabled:opacity-30 text-neutral-500 hover:bg-red-500/10 hover:text-red-400">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'Settings' ? (
                    <TrackerSettings userId={userId} />
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => <ItemCard key={item.id} item={item} />)
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 col-span-full rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-900/20">
                                <div className="p-4 rounded-full bg-neutral-900 mb-4">
                                    <Zap className="w-8 h-8 text-neutral-600" />
                                </div>
                                <span className="font-medium text-neutral-400 text-lg">Waiting for drops...</span>
                                <p className="text-sm text-neutral-500 mt-1">Make sure you have active trackers set up.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}