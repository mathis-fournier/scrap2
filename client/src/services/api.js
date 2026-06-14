const defaultHost = window?.location?.hostname || 'localhost';
const inferredApiUrl = `${window?.location?.protocol}//${defaultHost}:3000`;
export const API_URL = import.meta.env.VITE_API_URL || inferredApiUrl;

// Track if a refresh is in progress to prevent multiple simultaneous refreshes
let refreshPromise = null;

export const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
});

export const getRefreshToken = () => localStorage.getItem('refreshToken');

export const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
};

export const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken() {
    // If a refresh is already in progress, wait for it instead of making another request
    if (refreshPromise) {
        return refreshPromise;
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        clearTokens();
        window.location.href = '/login';
        return null;
    }

    refreshPromise = fetch(`${API_URL}/api/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
    })
        .then(async res => {
            if (res.status === 401) {
                const data = await res.json();
                if (data.code === 'INACTIVITY_TIMEOUT') {
                    // Session expired due to inactivity
                    clearTokens();
                    window.location.href = '/login?reason=inactivity';
                    return null;
                }
                // Refresh token expired or invalid - need to re-login
                clearTokens();
                window.location.href = '/login';
                return null;
            }

            if (!res.ok) {
                clearTokens();
                window.location.href = '/login';
                return null;
            }

            const data = await res.json();
            localStorage.setItem('accessToken', data.accessToken);
            return data.accessToken;
        })
        .catch(err => {
            console.error('Token refresh failed:', err);
            clearTokens();
            window.location.href = '/login';
            return null;
        })
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
}

export function authFetch(path, options = {}) {
    return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            ...getAuthHeaders()
        }
    }).then(async res => {
        // If access token expired, try to refresh
        if (res.status === 401) {
            const responseData = await res.json();
            if (responseData.code === 'TOKEN_EXPIRED' || responseData.code === 'INACTIVITY_TIMEOUT') {
                const newAccessToken = await refreshAccessToken();
                if (!newAccessToken) {
                    // Refresh failed, user is logged out
                    return res;
                }

                // Retry the original request with new token
                return fetch(`${API_URL}${path}`, {
                    ...options,
                    headers: {
                        ...(options.headers || {}),
                        Authorization: `Bearer ${newAccessToken}`
                    }
                });
            }
        }

        return res;
    });
}
