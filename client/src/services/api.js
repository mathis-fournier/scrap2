const defaultHost = window?.location?.hostname || 'localhost';
const inferredApiUrl = `${window?.location?.protocol}//${defaultHost}:3000`;
export const API_URL = import.meta.env.VITE_API_URL || inferredApiUrl;

export const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
});

export function authFetch(path, options = {}) {
    return fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            ...getAuthHeaders()
        }
    });
}
