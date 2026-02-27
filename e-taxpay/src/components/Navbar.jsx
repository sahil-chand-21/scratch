import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import LanguageToggle from './LanguageToggle'
import { FiMenu, FiX, FiUser, FiLogOut, FiEdit, FiHome } from 'react-icons/fi'

export default function Navbar({ variant = 'landing' }) {
    const { t } = useTranslation()
    const { user, logout, isAuthenticated, isAdmin } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [scrolled, setScrolled] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        setProfileOpen(false)
    }, [location])

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    const scrollToSection = (id) => {
        if (location.pathname !== '/') {
            navigate('/')
            setTimeout(() => {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
            }, 300)
        } else {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <Link to="/" className="navbar-brand">
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                    <circle cx="21" cy="21" r="20" fill="#821D30" stroke="#E8863A" strokeWidth="2" />
                    <path d="M21 8L28 18H14L21 8Z" fill="#E8863A" />
                    <path d="M14 18L21 28L28 18H14Z" fill="#FDFCF7" />
                    <path d="M17 22L21 28L25 22" stroke="#821D30" strokeWidth="1.5" />
                    <circle cx="21" cy="32" r="2" fill="#5B9A59" />
                </svg>
                <span>E-TaxPay</span>
            </Link>

            {variant === 'landing' && (
                <div className="navbar-links">
                    <button className="nav-link" onClick={() => scrollToSection('home')}>{t('nav.home')}</button>
                    <button className="nav-link" onClick={() => scrollToSection('about')}>{t('nav.about')}</button>
                    <button className="nav-link" onClick={() => scrollToSection('help')}>{t('nav.help')}</button>
                    <button className="nav-link" onClick={() => scrollToSection('complaints')}>{t('nav.complaints')}</button>
                    <button className="nav-link" onClick={() => scrollToSection('team')}>{t('nav.aboutUs')}</button>
                </div>
            )}

            <div className="navbar-actions">
                <LanguageToggle />

                {!isAuthenticated ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Link to="/login" className="btn btn-secondary btn-sm">{t('nav.login')}</Link>
                        <Link to="/register" className="btn btn-maroon btn-sm">{t('nav.register')}</Link>
                    </div>
                ) : (
                    <div className="profile-dropdown">
                        <button className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)}>
                            <div className="profile-avatar">
                                {user.username?.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                {user.username?.split(' ')[0]}
                            </span>
                        </button>
                        {profileOpen && (
                            <div className="profile-menu">
                                <Link
                                    to={isAdmin ? '/admin' : '/user'}
                                    className="profile-menu-item"
                                >
                                    <FiUser size={16} /> {t('nav.profile')}
                                </Link>
                                <Link to="/" className="profile-menu-item">
                                    <FiHome size={16} /> {t('nav.backToHome')}
                                </Link>
                                <button className="profile-menu-item danger" onClick={handleLogout}>
                                    <FiLogOut size={16} /> {t('nav.logout')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <button
                    className="btn btn-icon btn-secondary"
                    style={{ display: 'none' }}
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? <FiX /> : <FiMenu />}
                </button>
            </div>
        </nav>
    )
}
