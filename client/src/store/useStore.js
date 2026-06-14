import { create } from 'zustand';
import { io } from 'socket.io-client';
import { API_URL, getAuthHeaders, setTokens, clearTokens, authFetch } from '../services/api';

const INACTIVITY_THRESHOLD = 30 * 60 * 1000; // 30 minutes
let inactivityTimeout = null;
let activityListener = null;

const resetInactivityTimer = () => {
    if (inactivityTimeout) clearTimeout(inactivityTimeout);

    inactivityTimeout = setTimeout(() => {
        console.warn('User inactive for 30 minutes, logging out...');
        // Force logout
        window.location.href = '/login?reason=inactivity';
    }, INACTIVITY_THRESHOLD);
};

const setupActivityTracking = () => {
    if (activityListener) return;

    activityListener = () => resetInactivityTimer();

    // Track user activity
    document.addEventListener('mousedown', activityListener);
    document.addEventListener('keydown', activityListener);
    document.addEventListener('scroll', activityListener, true);
    document.addEventListener('touchstart', activityListener);

    resetInactivityTimer();
};

const removeActivityTracking = () => {
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
    if (activityListener) {
        document.removeEventListener('mousedown', activityListener);
        document.removeEventListener('keydown', activityListener);
        document.removeEventListener('scroll', activityListener, true);
        document.removeEventListener('touchstart', activityListener);
        activityListener = null;
    }
};

const useStore = create((set, get) => ({
    // State
    items: [],
    watchlist: [],
    cookieDead: false,
    userTier: 'free',
    socket: null,
    isAuthenticated: false,
    userId: null,
    role: null,

    // Actions
    setItems: (items) => set({ items }),
    setWatchlist: (watchlist) => set({ watchlist }),
    setCookieDead: (status) => set({ cookieDead: status }),
    setUserTier: (tier) => set({ userTier: tier }),

    setAuthUser: (userId, role) => {
        set({ isAuthenticated: true, userId, role });
        setupActivityTracking();
    },

    logout: async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            await fetch(`${API_URL}/api/logout`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            clearTokens();
            removeActivityTracking();
            set({ isAuthenticated: false, userId: null, role: null, items: [], watchlist: [] });
            get().disconnectSocket();
        }
    },

    // Network Actions
    initializeSocket: (userId) => {
        if (get().socket) return;

        const socket = io(API_URL, {
            query: { userId },
            auth: {
                token: localStorage.getItem('accessToken')
            }
        });

        socket.on('new-item', (newItem) => {
            set((state) => {
                const exists = state.items.find(i => i.id === newItem.id);
                return exists ? state : { items: [newItem, ...state.items] };
            });
        });

        socket.on('system-event', (event) => {
            if (event.type === 'COOKIE_DEAD') set({ cookieDead: true });
        });

        socket.on('unauthorized', () => {
            console.warn('Socket unauthorized, logging out...');
            get().logout();
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
            const kwRes = await authFetch(`/api/keywords/${userId}`);
            const itemsRes = await authFetch(`/api/items/${userId}`);
            const settingsRes = await authFetch('/api/settings');

            // Check for authentication errors
            if (kwRes.status === 401 || kwRes.status === 403 ||
                itemsRes.status === 401 || itemsRes.status === 403 ||
                settingsRes.status === 401 || settingsRes.status === 403) {

                console.warn('Authentication failed. Clearing session.');
                clearTokens();
                removeActivityTracking();
                set({ isAuthenticated: false, userId: null, role: null, items: [], watchlist: [] });
                window.location.href = '/login?reason=auth_failed';
                return;
            }

            const watchlistData = await kwRes.json();
            const itemsData = await itemsRes.json();

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
                    userTier: settingsData.tier || 'free'
                });
            }

            // Reset inactivity timer on successful data fetch
            setupActivityTracking();
        } catch (err) {
            console.error('Failed to fetch initial data', err);
            set({ items: [], watchlist: [] });
        }
    }
}));

export default useStore;
