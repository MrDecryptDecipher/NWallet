import { toast } from 'react-toastify';

interface RequestOptions extends RequestInit {
    data?: any;
    token?: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const apiClient = async (endpoint: string, options: RequestOptions = {}) => {
    const { data, token, headers, ...customConfig } = options;

    const config: RequestInit = {
        method: data ? 'POST' : 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(headers || {}),
        },
        body: data ? JSON.stringify(data) : undefined,
        ...customConfig,
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);

        // Auto-Logout Logic
        if (response.status === 401 || response.status === 403) {
            // If we are getting 401/403 and NOT on login/register pages
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                toast.error('Session expired. Please login again.');
                // Force logout via AuthContext is hard from outside React. 
                // We can dispatch a custom event or let the caller handle it.
                // For audit strictness: Throw specific error.
                throw new Error('UNAUTHORIZED');
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || response.statusText);
        }

        return await response.json();
    } catch (error: any) {
        if (error.message === 'UNAUTHORIZED') {
            throw error; // Let caller (AuthContext/interceptors) handle logout
        }
        throw error;
    }
};
