import { useState, useEffect, useRef } from 'react';
import { Key, Plus, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import useStore from '../store/useStore';
import { API_URL, getAuthHeaders } from '../services/api';

export default function TrackerSettings({ userId }) {
    // Local state for forms
    const [newSearchName, setNewSearchName] = useState('');
    const [cookieInput, setCookieInput] = useState('');
    const [cookiePreview, setCookiePreview] = useState('');
    const [cookieTouched, setCookieTouched] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [useProxy, setUseProxy] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingProxy, setIsSavingProxy] = useState(false);
    const isInitialProxyLoad = useRef(true);
    // Global state
    const { watchlist, setWatchlist, setCookieDead } = useStore();

    useEffect(() => {
        if (!userId) return;

        // Fetch specific settings on mount or when userId becomes available.
        const fetchSettings = async () => {
            try {
                const settingsRes = await fetch(`${API_URL}/api/settings`, { headers: getAuthHeaders() });
                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    setUseProxy(data.useProxy);
                    setCookiePreview(data.cookiePreview || '');
                    setCookieTouched(false);
                }
            } finally {
                isInitialProxyLoad.current = false;
            }
        };
        fetchSettings();
    }, [userId]);

    const saveUseProxy = async (value) => {
        setUseProxy(value);
        if (isInitialProxyLoad.current) return;

        setIsSavingProxy(true);
        const toastId = toast.loading('Saving connection preference...');

        try {
            const res = await fetch(`${API_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ userId, useProxy: value })
            });

            if (res.ok) {
                toast.success('Connection preference saved.', { id: toastId });
            } else {
                const data = await res.json();
                toast.error(`Failed to save preference: ${data.error}`, { id: toastId });
            }
        } catch (err) {
            toast.error('Network error while saving preference.', { id: toastId });
        } finally {
            setIsSavingProxy(false);
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();

        // UX: Show a loading state toast
        const toastId = toast.loading('Securing credentials...');
        const cookieValue = cookieTouched ? cookieInput : undefined;

        try {
            const res = await fetch(`${API_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ userId, cookie: cookieValue, useProxy })
            });

            if (res.ok) {
                if (cookieTouched && cookieInput) {
                    setCookiePreview(cookieInput.slice(0, 30));
                }
                setCookieInput('');
                setCookieTouched(false);
                setCookieDead(false);
                toast.success('Settings saved securely!', { id: toastId });
            } else {
                const data = await res.json();
                toast.error(`Save Failed: ${data.error}`, { id: toastId });
            }
        } catch (err) {
            toast.error('A network error occurred while saving.', { id: toastId });
        }
    };

    const handleAddKeyword = async (e) => {
        e.preventDefault();
        const trimmedName = newSearchName.trim();
        if (!trimmedName) return;

        try {
            const res = await fetch(`${API_URL}/api/keywords`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ userId, keyword: trimmedName, minPrice: minPrice || null, maxPrice: maxPrice || null })
            });

            if (res.ok) {
                const newKeyword = await res.json();
                setWatchlist([...watchlist, newKeyword]);
                setNewSearchName('');
                setMinPrice('');
                setMaxPrice('');
                toast.success(`Now tracking: ${trimmedName}`);
            }
        } catch (err) {
            toast.error('Failed to add tracker.');
        }
    };

    const deleteKeyword = async (id) => {
        try {
            const res = await fetch(`${API_URL}/api/keywords/${id}?userId=${userId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                setWatchlist(watchlist.filter(kw => kw.id !== id));
                toast.success('Tracker removed.');
            }
        } catch (err) {
            toast.error('Failed to remove tracker.');
        }
    };

    const handleGenerateCookie = async () => {
        setIsGenerating(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/settings/generate-cookie`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Cookie successfully generated and saved!');
                if (data.cookie) {
                    setCookiePreview(data.cookie.slice(0, 30));
                    setCookieInput('');
                    setCookieTouched(false);
                }
            } else {
                toast.error(data.error || 'Failed to generate cookie');
            }
        } catch (error) {
            toast.error('Network error while generating cookie');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-3xl space-y-8">
            <div className="p-6 border rounded-2xl border-neutral-800 bg-neutral-900/50">
                <h2 className="mb-4 text-lg font-semibold text-white">Platform Credentials & Network Setup</h2>
                <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        <div className="flex-1">
                            <label className="block mb-2 text-sm font-medium text-neutral-400">Vinted Session Cookie</label>
                            <input
                                type="text"
                                value={cookieTouched ? cookieInput : (cookieInput || cookiePreview)}
                                onChange={(e) => {
                                    setCookieInput(e.target.value);
                                    setCookieTouched(true);
                                }}
                                placeholder={cookiePreview ? '' : 'Paste your cookie...'}
                                className="w-full px-4 py-3 text-white border rounded-xl border-neutral-700 bg-neutral-950 focus:border-teal-500 focus:outline-none"
                            />
                        </div>
                        <button
                            onClick={handleGenerateCookie}
                            disabled={isGenerating}
                            className="flex items-center justify-center gap-2 px-6 py-3 font-medium text-white transition-colors bg-teal-600 rounded-xl hover:bg-teal-500"
                        >
                            {isGenerating ? 'Generating...' : 'Auto-Generate Cookie'}
                        </button>
                        <button type="submit" className="flex items-center justify-center gap-2 px-6 py-3 font-medium text-white transition-colors bg-teal-600 rounded-xl hover:bg-teal-500">
                            <Key className="w-5 h-5" /> Save
                        </button>
                    </div>
                    <div className="pt-2 border-t border-neutral-800">
                        <label className="block mb-3 text-sm font-medium text-neutral-400">Connection Preference</label>
                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                            <label className="flex items-center gap-3 p-3 transition-colors border rounded-lg cursor-pointer border-neutral-800 hover:border-neutral-600 bg-neutral-950/50">
                                <input type="radio" checked={useProxy} onChange={() => saveUseProxy(true)} className="w-4 h-4 text-teal-600 bg-neutral-900 border-neutral-700" disabled={isSavingProxy} />
                                <span className="text-sm font-medium text-white">Use Proxies (Recommended)</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 transition-colors border rounded-lg cursor-pointer border-neutral-800 hover:border-neutral-600 bg-neutral-950/50">
                                <input type="radio" checked={!useProxy} onChange={() => saveUseProxy(false)} className="w-4 h-4 text-teal-600 bg-neutral-900 border-neutral-700" disabled={isSavingProxy} />
                                <span className="text-sm font-medium text-white">Use Local Network</span>
                            </label>
                        </div>
                    </div>
                </form>
            </div>

            {/* Tracker Addition Form */}
            <div className="p-6 border rounded-2xl border-neutral-800 bg-neutral-900/50">
                <h2 className="mb-4 text-lg font-semibold text-white">Add New Tracker</h2>
                <form onSubmit={handleAddKeyword} className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1">
                        <label className="block mb-2 text-sm font-medium text-neutral-400">Search Keyword</label>
                        <input type="text" value={newSearchName} onChange={(e) => setNewSearchName(e.target.value)} placeholder="e.g. Nike Dunks" className="w-full px-4 py-3 text-white border rounded-xl border-neutral-700 bg-neutral-950 focus:border-teal-500 focus:outline-none" required />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block mb-2 text-sm font-medium text-neutral-400">Min (€)</label>
                            <input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" className="w-full px-4 py-3 text-white border rounded-xl border-neutral-700 bg-neutral-950 focus:border-teal-500 focus:outline-none" />
                        </div>
                        <div className="flex-1">
                            <label className="block mb-2 text-sm font-medium text-neutral-400">Max (€)</label>
                            <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="100" className="w-full px-4 py-3 text-white border rounded-xl border-neutral-700 bg-neutral-950 focus:border-teal-500 focus:outline-none" />
                        </div>
                    </div>
                    <button type="submit" className="flex items-center justify-center gap-2 px-6 py-3 font-medium text-white transition-colors bg-teal-600 rounded-xl hover:bg-teal-500">
                        <Plus className="w-5 h-5" /> Track
                    </button>
                </form>
            </div>

            {/* Watchlist */}
            <div className="p-6 border rounded-2xl border-neutral-800 bg-neutral-900/50">
                <h2 className="mb-4 text-lg font-semibold text-white">Active Watchlist ({watchlist.length})</h2>
                {watchlist.length > 0 ? (
                    <ul className="divide-y divide-neutral-800/60">
                        {watchlist.map((watchItem) => (
                            <li key={watchItem.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800/80">
                                        <Tag className="w-4 h-4 text-teal-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{watchItem.name}</p>
                                        <p className="text-xs text-neutral-500">
                                            Active monitor {watchItem.min_price || watchItem.max_price ? `• ${watchItem.min_price || 0}€ - ${watchItem.max_price || '∞'}€` : ''}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => deleteKeyword(watchItem.id)} className="p-2 transition-colors text-neutral-500 hover:text-red-400">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl border-neutral-800/50 bg-neutral-950/50">
                        <span className="text-neutral-500">Your watchlist is empty.</span>
                    </div>
                )}
            </div>
        </div>
    );
}