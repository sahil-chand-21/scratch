import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

// Removed hardcoded mock users as they are now handled by the backend

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loginAttempts, setLoginAttempts] = useState(0)
    const [isLocked, setIsLocked] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem('etaxpay-user')
        if (saved) {
            try {
                setUser(JSON.parse(saved))
            } catch (e) {
                localStorage.removeItem('etaxpay-user')
            }
        }
        setLoading(false)
    }, [])

    const login = async (credentials, type = 'user') => {
        if (isLocked) {
            throw new Error('Account locked due to too many failed attempts.')
        }

        try {
            const endpoint = type === 'user' ? '/auth/login/user' : '/auth/login/admin';
            
            // Send credentials directly to backend (no demo bypass)
            const authPayload = { ...credentials };

            const response = await api.post(endpoint, authPayload);

            if (response.data.success && response.data.user) {
                const userData = response.data.user;
                setUser(userData);
                localStorage.setItem('etaxpay-user', JSON.stringify(userData));
                setLoginAttempts(0);
                return userData;
            } else {
                throw new Error('invalid');
            }
        } catch(error) {
            const attempts = loginAttempts + 1
            setLoginAttempts(attempts)
            if (attempts >= 5) {
                setIsLocked(true)
                setTimeout(() => {
                    setIsLocked(false)
                    setLoginAttempts(0)
                }, 30 * 60 * 1000)
                throw new Error('locked')
            }
            throw new Error('invalid')
        }
    }

    const register = async (userData) => {
        const response = await api.post('/auth/register', userData);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Registration failed');
        }
        return response.data;
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('etaxpay-user')
    }

    const updateProfile = (updates) => {
        const updated = { ...user, ...updates }
        setUser(updated)
        localStorage.setItem('etaxpay-user', JSON.stringify(updated))
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isLocked,
            loginAttempts,
            login,
            logout,
            register,
            updateProfile,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'super_admin' || user?.role === 'district_admin',
            isUser: user?.role === 'user'
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
