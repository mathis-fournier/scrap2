import { useState, useEffect, useRef } from 'react';
import { Key, Plus, Trash2, Tag, Filter, Search, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { toast } from 'sonner';
import useStore from '../store/useStore';
import { API_URL, getAuthHeaders } from '../services/api';

export default function TrackerSettings({ userId }) {
    // Local state for forms
    const [trackerName, setTrackerName] = useState('');
    const [searchText, setSearchText] = useState('');
    const [cookieInput, setCookieInput] = useState('');
    const [cookiePreview, setCookiePreview] = useState('');
    const [cookieTouched, setCookieTouched] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    // Strict Filter States
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [searchTitle, setSearchTitle] = useState('');
    const [targetBrand, setTargetBrand] = useState('');
    const [targetSize, setTargetSize] = useState('');

    const [useProxy, setUseProxy] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingProxy, setIsSavingProxy] = useState(false);
    const isInitialProxyLoad = useRef(true);

    // Global state
    const { watchlist, setWatchlist, setCookieDead } = useStore();

    useEffect(() => {
        if (!userId) return;

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

        if (!searchText.trim()) {
            toast.error('Base Search Keyword is required.');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/keywords`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    userId,
                    trackerName: trackerName.trim() || null,
                    searchText: searchText.trim(),
                    minPrice: minPrice || null,
                    maxPrice: maxPrice || null,
                    searchTitle: searchTitle.trim() || null,
                    targetBrand: targetBrand.trim() || null,
                    targetSize: targetSize.trim() || null
                })
            });

            if (res.ok) {
                const newKeyword = await res.json();
                setWatchlist([...watchlist, newKeyword]);

                // Reset form
                setTrackerName('');
                setSearchText('');
                setMinPrice('');
                setMaxPrice('');
                setSearchTitle('');
                setTargetBrand('');
                setTargetSize('');
                setShowAdvanced(false);

                toast.success(`Tracker added successfully!`);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to add tracker.');
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
            const accessToken = localStorage.getItem('accessToken');
            const response = await fetch(`${API_URL}/api/settings/generate-cookie`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` }
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
        <div className="max-w-4xl space-y-8">

            {/* 1. Global Setup (Moved to be clearly distinct) */}
            <div className="p-6 border rounded-2xl border-neutral-800 bg-neutral-900/40">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-teal-500/10 rounded-lg">
                        <Key className="w-5 h-5 text-teal-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Platform Configuration</h2>
                        <p className="text-sm text-neutral-400">Manage your connection settings and session cookies.</p>
                    </div>
                </div>

                <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        <div className="flex-1">
                            <label className="block mb-2 text-sm font-medium text-neutral-300">Vinted Session Cookie</label>
                            <input
                                type="text"
                                value={cookieTouched ? cookieInput : (cookieInput || cookiePreview)}
                                onChange={(e) => {
                                    setCookieInput(e.target.value);
                                    setCookieTouched(true);
                                }}
                                placeholder={cookiePreview ? 'Cookie is active. Paste a new one to replace...' : 'Paste your raw cookie string...'}
                                className="w-full px-4 py-3 text-sm text-white transition-colors border rounded-xl border-neutral-700 bg-neutral-950 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleGenerateCookie}
                                disabled={isGenerating}
                                type="button"
                                className="flex items-center justify-center px-6 py-3 text-sm font-medium text-white transition-colors bg-neutral-800 border border-neutral-700 rounded-xl hover:bg-neutral-700 disabled:opacity-50 whitespace-nowrap"
                            >
                                {isGenerating ? 'Generating...' : 'Auto-Generate'}
                            </button>
                            <button type="submit" className="flex items-center justify-center px-6 py-3 text-sm font-medium text-black transition-colors bg-teal-500 rounded-xl hover:bg-teal-400">
                                Save Settings
                            </button>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-neutral-800/60">
                        <label className="block mb-3 text-sm font-medium text-neutral-300">Network Routing</label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <label className={`flex-1 flex items-center gap-3 p-4 transition-colors border rounded-xl cursor-pointer ${useProxy ? 'border-teal-500/50 bg-teal-500/5' : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-600'}`}>
                                <input type="radio" checked={useProxy} onChange={() => saveUseProxy(true)} className="w-4 h-4 text-teal-500 bg-neutral-900 border-neutral-700 focus:ring-teal-500" disabled={isSavingProxy} />
                                <div>
                                    <span className="block text-sm font-medium text-white">Use Proxies</span>
                                    <span className="block text-xs text-neutral-500 mt-0.5">Recommended. Prevents IP bans.</span>
                                </div>
                            </label>
                            <label className={`flex-1 flex items-center gap-3 p-4 transition-colors border rounded-xl cursor-pointer ${!useProxy ? 'border-teal-500/50 bg-teal-500/5' : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-600'}`}>
                                <input type="radio" checked={!useProxy} onChange={() => saveUseProxy(false)} className="w-4 h-4 text-teal-500 bg-neutral-900 border-neutral-700 focus:ring-teal-500" disabled={isSavingProxy} />
                                <div>
                                    <span className="block text-sm font-medium text-white">Local Network</span>
                                    <span className="block text-xs text-neutral-500 mt-0.5">Uses your current IP address.</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </form>
            </div>

            {/* 2. Tracker Creation Form */}
            <div className="p-6 border rounded-2xl border-neutral-800 bg-neutral-900/60 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Search className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Create New Tracker</h2>
                        <p className="text-sm text-neutral-400">Set up what you want to monitor as soon as it drops.</p>
                    </div>
                </div>

                <form onSubmit={handleAddKeyword} className="flex flex-col gap-6">
                    {/* Basic Settings */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <label className="block mb-2 text-sm font-medium text-neutral-300">Display Name <span className="text-neutral-600 font-normal">(Optional)</span></label>
                            <input type="text" value={trackerName} onChange={(e) => setTrackerName(e.target.value)} placeholder="e.g., Personal Shoe Bot - Nike Dunks" className="w-full px-4 py-3 text-sm text-white transition-colors border rounded-xl border-neutral-700 bg-neutral-950 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-neutral-300">Search Keywords <span className="text-red-400">*</span></label>
                            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="e.g., Nike Dunk Low" className="w-full px-4 py-3 text-sm text-white transition-colors border rounded-xl border-neutral-700 bg-neutral-950 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" required />
                            <p className="text-xs text-neutral-500 mt-1.5">The exact phrase you would type into Vinted.</p>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-neutral-300">Price Range <span className="text-neutral-600 font-normal">(€)</span></label>
                            <div className="flex items-center gap-3">
                                <input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" className="w-full px-4 py-3 text-sm text-white transition-colors border rounded-xl border-neutral-700 bg-neutral-950 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                <span className="text-neutral-600">-</span>
                                <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" className="w-full px-4 py-3 text-sm text-white transition-colors border rounded-xl border-neutral-700 bg-neutral-950 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                        </div>
                    </div>

                    {/* Advanced Filters Toggle */}
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                        >
                            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
                        </button>
                    </div>

                    {/* Advanced Settings (Progressive Disclosure) */}
                    {showAdvanced && (
                        <div className="p-5 border rounded-xl border-neutral-800 bg-neutral-950/50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-start gap-3 mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-indigo-200 leading-relaxed">
                                    These filters run <strong>after</strong> Vinted returns results. They ensure you only get notified for exact matches, ignoring Vinted's promoted items or loose keyword matches.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="block mb-2 text-xs font-medium text-neutral-400">Strict Title Match</label>
                                    <input type="text" value={searchTitle} onChange={(e) => setSearchTitle(e.target.value)} placeholder="e.g., Low" className="w-full px-4 py-2.5 text-sm text-white transition-colors border rounded-lg border-neutral-700 bg-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block mb-2 text-xs font-medium text-neutral-400">Exact Brand</label>
                                    <input type="text" value={targetBrand} onChange={(e) => setTargetBrand(e.target.value)} placeholder="e.g., Nike" className="w-full px-4 py-2.5 text-sm text-white transition-colors border rounded-lg border-neutral-700 bg-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block mb-2 text-xs font-medium text-neutral-400">Exact Size</label>
                                    <input type="text" value={targetSize} onChange={(e) => setTargetSize(e.target.value)} placeholder="e.g., 42.5" className="w-full px-4 py-2.5 text-sm text-white transition-colors border rounded-lg border-neutral-700 bg-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-neutral-800/60 mt-2">
                        <button type="submit" className="flex items-center justify-center gap-2 px-8 py-3 text-sm font-semibold text-white transition-all bg-indigo-600 rounded-xl hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25">
                            <Plus className="w-5 h-5" /> Start Tracking
                        </button>
                    </div>
                </form>
            </div>

            {/* 3. Watchlist */}
            <div className="p-6 border rounded-2xl border-neutral-800 bg-neutral-900/40">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-neutral-800 rounded-lg">
                        <Filter className="w-5 h-5 text-neutral-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Active Watchlist ({watchlist.length})</h2>
                        <p className="text-sm text-neutral-400">Items currently being monitored by the scraper.</p>
                    </div>
                </div>

                {watchlist.length > 0 ? (
                    <ul className="divide-y divide-neutral-800/60 border border-neutral-800/60 rounded-xl overflow-hidden">
                        {watchlist.map((watchItem) => (
                            <li key={watchItem.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between bg-neutral-950/30 hover:bg-neutral-800/30 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="flex items-center justify-center w-10 h-10 mt-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                                        <Tag className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{watchItem.name || watchItem.search_text}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                                            <span className="text-neutral-400">
                                                {watchItem.min_price || watchItem.max_price ? `Price: ${watchItem.min_price || 0}€ - ${watchItem.max_price || '∞'}€` : 'Any price'}
                                            </span>

                                            {(watchItem.search_title || watchItem.target_brand || watchItem.target_size) && (
                                                <span className="text-neutral-600">•</span>
                                            )}

                                            {watchItem.search_title && <span className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">Title: {watchItem.search_title}</span>}
                                            {watchItem.target_brand && <span className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">Brand: {watchItem.target_brand}</span>}
                                            {watchItem.target_size && <span className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">Size: {watchItem.target_size}</span>}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => deleteKeyword(watchItem.id)} className="p-2.5 transition-colors rounded-lg text-neutral-500 hover:bg-red-500/10 hover:text-red-400 self-end sm:self-auto shrink-0">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-xl border-neutral-800/50 bg-neutral-950/30">
                        <Tag className="w-8 h-8 mb-3 text-neutral-700" />
                        <span className="font-medium text-neutral-400">Your watchlist is currently empty.</span>
                    </div>
                )}
            </div>
        </div>
    );
}