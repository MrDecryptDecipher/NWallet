import React, { createContext, useContext, useState, useEffect } from 'react';

// Secure In-Memory Storage
interface AuthState {
    token: string | null;
    user: any | null;
    isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
    login: (token: string, user: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        token: null,
        user: null,
        isAuthenticated: false,
    });

    const login = (token: string, user: any) => {
        setState({ token, user, isAuthenticated: true });
        // In a real app we might set an HttpOnly cookie here, but for this standalone audit 
        // we keep it in memory as requested.
    };

    const logout = () => {
        setState({ token: null, user: null, isAuthenticated: false });
        // Clear cookies if any
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
