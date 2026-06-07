import { create } from 'zustand';
import { io } from 'socket.io-client';
import { API_URL, getAuthHeaders } from '../services/api';

const useStore = create((set, get) => ({
    // State
    items: [],
    watchlist: [],
    cookieDead: false,
    userTier: 'free', // NEW: Default to free
    socket: null,

    // Actions
    setItems: (items) => set({ items }),
    setWatchlist: (watchlist) => set({ watchlist }),
    setCookieDead: (status) => set({ cookieDead: status }),
    setUserTier: (tier) => set({ userTier: tier }),

    // Network Actions
    initializeSocket: (userId) => {
        if (get().socket) return;

        const socket = io(API_URL, { query: { userId } });

        socket.on('new-item', (newItem) => {
            set((state) => {
                const exists = state.items.find(i => i.id === newItem.id);
                return exists ? state : { items: [newItem, ...state.items] };
            });
        });

        socket.on('system-event', (event) => {
            if (event.type === 'COOKIE_DEAD') set({ cookieDead: true });
        });

        set({ socket });
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null });
        }
    },

    fetchInitialData: async (userId) => {
        try {
            const kwRes = await fetch(`${API_URL}/api/keywords/${userId}`, { headers: getAuthHeaders() });
            const itemsRes = await fetch(`${API_URL}/api/items/${userId}`, { headers: getAuthHeaders() });
            const settingsRes = await fetch(`${API_URL}/api/settings`, { headers: getAuthHeaders() });

            // 1. Intercept 401/403 errors and purge the dead token
            if (kwRes.status === 401 || kwRes.status === 403 ||
                itemsRes.status === 401 || itemsRes.status === 403 ||
                settingsRes.status === 401 || settingsRes.status === 403) {

                console.warn('Authentication failed or token expired. Clearing session.');

                // 1. Wipe EVERYTHING (token, userId, role)
                localStorage.clear();

                // 2. Clear the store data just in case
                set({ items: [], watchlist: [] });

                // 3. Force the app to reload. 
                // When it reloads, Panel.jsx will read a null userId and show the AuthScreen.
                window.location.reload();
                return;
            }

            const watchlistData = await kwRes.json();
            const itemsData = await itemsRes.json();

            // 2. Fallback protection: Guarantee we only save arrays into the state
            const watchlist = Array.isArray(watchlistData)
                ? watchlistData
                : Array.isArray(watchlistData?.keywords)
                    ? watchlistData.keywords
                    : [];

            set({
                watchlist,
                items: Array.isArray(itemsData) ? itemsData : []
            });

            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                set({
                    cookieDead: !settingsData.hasCookie,
                    userTier: settingsData.tier || 'free' // Capture the tier from your settings/auth endpoint
                });
            }
        } catch (err) {
            console.error('Failed to fetch initial data', err);
            // Make sure state doesn't end up undefined on hard network failures
            set({ items: [], watchlist: [] });
        }
    }
}));

export default useStore;