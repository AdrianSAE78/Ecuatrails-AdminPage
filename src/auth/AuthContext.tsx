import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSession, login as loginApi } from '../api/auth';
import type { Role } from './types';

interface AuthState {
    token: string | null;
    roles: Role[];
    username?: string;
}

interface AuthContextValue extends AuthState {
    isAuthenticated: boolean;
    hasRole: (role: Role) => boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    hydrate: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        token: localStorage.getItem('token'),
        roles: JSON.parse(localStorage.getItem('roles') || '[]'),
        username: localStorage.getItem('username') || undefined,
    });

    const isAuthenticated = !!state.token;

    const hasRole = (role: Role) => state.roles.includes(role);

    const login = async (username: string, password: string) => {
        const data = await loginApi(username, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('roles', JSON.stringify(data.user.roles));
        localStorage.setItem('username', data.user.username);
        setState({ token: data.token, roles: data.user.roles, username: data.user.username });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('roles');
        localStorage.removeItem('username');
        setState({ token: null, roles: [] });
    };

    const hydrate = async () => {
        if (!state.token) return;
        try {
            const session = await getSession();
            localStorage.setItem('roles', JSON.stringify(session.user.roles));
            localStorage.setItem('username', session.user.username);
            setState((s) => ({ ...s, roles: session.user.roles, username: session.user.username }));
        } catch {
            logout();
        }
    };

    useEffect(() => {
        void hydrate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const onLogout = () => logout();
        window.addEventListener('app:logout', onLogout);
        return () => window.removeEventListener('app:logout', onLogout);
    }, []);

    const value = useMemo<AuthContextValue>(() => ({
        ...state,
        isAuthenticated,
        hasRole,
        login,
        logout,
        hydrate,
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [state]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}