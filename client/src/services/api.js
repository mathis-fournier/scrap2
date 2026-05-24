export const API_URL = 'http://localhost:3000';

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
