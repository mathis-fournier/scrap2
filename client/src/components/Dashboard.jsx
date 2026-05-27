import { useState, useEffect } from 'react';
import {
    ShoppingBag, Package, Tag, Globe, Settings, Zap, Menu, X, LogOut, Trash2, ShieldCheck, Users, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { ItemCard } from './ItemCards';
import TrackerSettings from './TrackerSettings';
import useStore from '../store/useStore';
import { API_URL, getAuthHeaders } from '../services/api';

export default function Dashboard({ userId, role, onLogout }) {
    const [activeTab, setActiveTab] = useState('Vinted');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Local state reserved purely for Admin Panel
    const [adminStats, setAdminStats] = useState({ users: 0, keywords: 0, items: 0 });
    const [adminUsers, setAdminUsers] = useState([]);

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

    const filteredItems = items.filter(item => item.platform === activeTab);

    return (
        <div className="flex w-full h-screen overflow-hidden font-sans bg-neutral-950 text-neutral-200">
            {/* Mobile Nav Header */}
            <div className="fixed top-0 z-50 flex items-center justify-between w-full px-4 py-3 border-b md:hidden border-neutral-800 bg-neutral-900">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-teal-500" />
                    <span className="font-bold text-white">FinderPro</span>
                </div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-neutral-400">
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 flex-col border-r border-neutral-800 bg-neutral-900/95 backdrop-blur-xl transition-transform duration-300 md:static md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="items-center justify-between hidden h-16 px-6 border-b md:flex border-neutral-800/60 md:h-20">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-linear-to-br from-teal-400 to-teal-600 shadow-[0_0_15px_rgba(20,184,166,0.3)] md:h-10 md:w-10">
                            <Zap className="w-4 h-4 text-white fill-white" />
                        </div>
                        <span className="text-lg font-bold tracking-wide text-white md:text-xl">Finder<span className="text-teal-500">Pro</span></span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar">
                    <div className="px-3 mb-4 text-xs font-semibold tracking-wider uppercase text-neutral-500">Platforms</div>
                    {platforms.map((platform) => (
                        <li key={platform.name} className="list-none">
                            <button onClick={() => { setActiveTab(platform.name); setIsSidebarOpen(false); }} className={`group relative mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 ${activeTab === platform.name ? 'bg-teal-500/10 text-teal-400' : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'}`}>
                                <platform.icon className="w-5 h-5" /> {platform.name}
                            </button>
                        </li>
                    ))}

                    <div className="px-3 mt-8 mb-4 text-xs font-semibold tracking-wider uppercase text-neutral-500">System</div>
                    <li className="list-none">
                        <button onClick={() => { setActiveTab('Settings'); setIsSidebarOpen(false); }} className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 ${activeTab === 'Settings' ? 'bg-teal-500/10 text-teal-400' : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'}`}>
                            <Settings className="w-5 h-5" /> Settings
                        </button>
                    </li>

                    {role === 'admin' && (
                        <li className="list-none mt-2">
                            <button onClick={() => { setActiveTab('AdminPanel'); setIsSidebarOpen(false); }} className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 ${activeTab === 'AdminPanel' ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'}`}>
                                <ShieldCheck className="w-5 h-5 text-indigo-500" /> Admin Panel
                            </button>
                        </li>
                    )}
                </nav>

                <div className="p-4 border-t border-neutral-800/60">
                    <button onClick={onLogout} className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-red-400 transition-colors rounded-xl bg-red-500/10 hover:bg-red-500/20">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 pt-20 overflow-y-auto md:p-8 md:pt-8">

                {/* Global Cookie Warning */}
                {cookieDead && activeTab !== 'AdminPanel' && activeTab !== 'Settings' && (
                    <div className="flex items-center justify-between p-4 mb-6 font-medium text-red-400 border border-red-500 bg-red-500/20 rounded-xl">
                        <span>⚠️ Scanning Halted: Your Vinted session cookie is missing or has expired.</span>
                        <button onClick={() => setActiveTab('Settings')} className="px-4 py-2 text-sm font-bold text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600">Update Now</button>
                    </div>
                )}

                <header className="flex items-end justify-between mb-6 md:mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                            {activeTab === 'Settings' ? 'Scraper Settings' : activeTab === 'AdminPanel' ? 'System Overview' : `${activeTab} Monitor`}
                        </h1>
                    </div>
                </header>

                {/* Sub-components Routing */}
                {activeTab === 'AdminPanel' ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="p-6 border rounded-2xl border-neutral-800 bg-neutral-900/50">
                                <div className="flex items-center gap-3 mb-2 text-neutral-400"><Users className="w-5 h-5" /> Total Users</div>
                                <div className="text-3xl font-bold text-white">{adminStats.users}</div>
                            </div>
                            <div className="p-6 border rounded-2xl border-neutral-800 bg-neutral-900/50">
                                <div className="flex items-center gap-3 mb-2 text-neutral-400"><Activity className="w-5 h-5" /> Active Trackers</div>
                                <div className="text-3xl font-bold text-white">{adminStats.keywords}</div>
                            </div>
                            <div className="p-6 border rounded-2xl border-neutral-800 bg-neutral-900/50">
                                <div className="flex items-center gap-3 mb-2 text-neutral-400"><Package className="w-5 h-5" /> Items Scraped</div>
                                <div className="text-3xl font-bold text-white">{adminStats.items}</div>
                            </div>
                        </div>

                        <div className="overflow-hidden border rounded-2xl border-neutral-800 bg-neutral-900/50">
                            <div className="p-6 border-b border-neutral-800">
                                <h2 className="text-lg font-semibold text-white">Registered Accounts</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-neutral-400">
                                    <thead className="text-xs uppercase bg-neutral-950/50 text-neutral-500">
                                        <tr>
                                            <th className="px-6 py-4">Email</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Proxy Setup</th>
                                            <th className="px-6 py-4">Cookie Health</th>
                                            <th className="px-6 py-4">Trackers</th>
                                            <th className="px-6 py-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800">
                                        {adminUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-neutral-800/30">
                                                <td className="px-6 py-4 font-medium text-white">{user.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-neutral-800 text-neutral-300'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">{user.proxy_url ? '✅ Assigned' : '❌ None'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${user.cookie_status === 'Active' ? 'bg-teal-500/20 text-teal-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {user.cookie_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">{user.keyword_count}</td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => deleteUser(user.id)} disabled={user.role === 'admin'} className="p-2 transition-colors disabled:opacity-50 text-neutral-500 hover:text-red-400">
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
                            <div className="flex flex-col items-center justify-center h-60 col-span-full rounded-2xl border-2 border-dashed border-neutral-800/50 bg-neutral-900/20">
                                <Zap className="w-8 h-8 mb-4 text-neutral-700" />
                                <span className="font-medium text-neutral-500">Waiting for drops...</span>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}