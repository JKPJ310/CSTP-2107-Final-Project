import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const links = [
    { to: '/', label: 'Home' },
    { to: '/tips', label: 'Tips' },
    { to: '/results', label: 'Results' },
    { to: '/assessment', label: 'Assessment' }
]

const Navbar = () => {

    const [menuOpen, setMenuOpen] = useState(false);

    const handleToggleMenu = () => {
        setMenuOpen(!menuOpen);
    }

    const handleCloseMenu = () => {
        setMenuOpen(false);
    }

    const linkClass = ({ isActive }) =>
        `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-ink text-white' : 'text-ink hover:bg-line/60'}`;

    return (
        <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur border-b border-line">
            <nav className="max-w-5xl mx-auto flex items-center justify-between px-5 py-3">
                <Link to='/' onClick={handleCloseMenu} className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
                    <img src="/logo.png" alt="" className="w-8 h-8" />
                    Equilibria
                </Link>
                {/* Desktop links */}
                <ul className="hidden md:flex items-center gap-2">
                    {links.map((link) => (
                        <li key={link.to}>
                            <NavLink to={link.to} end className={linkClass}>{link.label}</NavLink>
                        </li>
                    ))}
                </ul>
                {/* Mobile menu button */}
                <button
                    onClick={handleToggleMenu}
                    type="button"
                    aria-expanded={menuOpen}
                    aria-controls="mobile-menu"
                    aria-label="Toggle menu"
                    className="md:hidden rounded-lg p-2 text-ink hover:bg-line/60"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        {menuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
                {/* Mobile menu */}
                {menuOpen && (
                    <ul id="mobile-menu" className="absolute top-full left-0 w-full bg-paper/90 backdrop-blur border-t border-line md:hidden">
                        {links.map((link) => (
                            <li key={link.to} className="border-b border-line">
                                <NavLink to={link.to} end className={linkClass} onClick={handleCloseMenu}>
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                )}
            </nav>
        </header>
    )
}

export default Navbar