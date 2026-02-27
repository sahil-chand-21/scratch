import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Mock user data for demo
const MOCK_USERS = {
    'user': {
        id: '1',
        username: 'Rajesh Kumar',
        gstId: '05AAAPZ2694Q1ZN',
        role: 'user',
        mobile: '9876543210',
        district: 'almora',
        block: 'almora_block',
        businessType: 'general',
        fatherName: 'Shri Ram Kumar',
        email: 'rajesh@example.com',
        avatar: null,
        createdAt: '2025-06-15'
    },
    'admin': {
        id: '100',
        username: 'Admin Officer',
        role: 'super_admin',
        district: 'almora',
        email: 'admin@etaxpay.uk.gov.in',
        avatar: null,
        createdAt: '2025-01-01'
    }
}

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

        // Simulate authentication
        await new Promise(r => setTimeout(r, 800))

        if (type === 'user') {
            if (credentials.gstId && credentials.password === 'demo123') {
                const userData = { ...MOCK_USERS.user, gstId: credentials.gstId }
                setUser(userData)
                localStorage.setItem('etaxpay-user', JSON.stringify(userData))
                setLoginAttempts(0)
                return userData
            }
        } else {
            if (credentials.username && credentials.password === 'admin123' && credentials.passkey === 'ADMIN2026') {
                const userData = { ...MOCK_USERS.admin, username: credentials.username }
                setUser(userData)
                localStorage.setItem('etaxpay-user', JSON.stringify(userData))
                setLoginAttempts(0)
                return userData
            }
        }

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

    const register = async (userData) => {
        await new Promise(r => setTimeout(r, 1000))
        return { success: true, message: 'Registration successful!' }
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
