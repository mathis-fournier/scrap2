import { create } from 'zustand';
import { io } from 'socket.io-client';
import { API_URL, getAuthHeaders } from '../services/api';

const useStore = create((set, get) => ({
    // State
    items: [],
    watchlist: [],
    cookieDead: false,
    socket: null,

    // Actions
    setItems: (items) => set({ items }),
    setWatchlist: (watchlist) => set({ watchlist }),
    setCookieDead: (status) => set({ cookieDead: status }),

    // Network Actions
    initializeSocket: (userId) => {
        if (get().socket) return; // Prevent multiple connections

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

            const watchlist = await kwRes.json();
            const items = await itemsRes.json();

            set({ watchlist, items });

            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                set({ cookieDead: !settingsData.hasCookie });
            }
        } catch (err) {
            console.error('Failed to fetch initial data', err);
        }
    }
}));

export default useStore;