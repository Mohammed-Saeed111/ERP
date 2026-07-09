import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    FaBars,
    FaBell,
    FaChevronLeft,
    FaMoon,
    FaSun,
    FaTachometerAlt,
    FaListAlt,
    FaBoxOpen,
    FaTruck,
    FaShoppingCart,
    FaUsers,
    FaUserCircle,
    FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig.js';
import { useEffect, useMemo, useState } from 'react';

const adminItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <FaTachometerAlt />, isParent: true },
    { name: 'Category', path: '/admin/categories', icon: <FaListAlt /> },
    { name: 'Products', path: '/admin/products', icon: <FaBoxOpen /> },
    { name: 'Supplier', path: '/admin/suppliers', icon: <FaTruck /> },
    {
        name: 'Orders',
        path: '/admin/orders',
        icon: <FaShoppingCart />,
        children: [
            { name: 'All Orders', path: '/admin/orders', icon: <FaListAlt /> },
            { name: 'Pending', path: '/admin/orders/pending', icon: <FaListAlt /> }
        ]
    },
    { name: 'Alerts', path: '/admin/alerts', icon: <FaBell /> },
    { name: 'Users', path: '/admin/users', icon: <FaUsers /> },
    { name: 'Profile', path: '/admin/profile', icon: <FaUserCircle /> }
];

const customerItems = [
    { name: 'Products', path: '/customer-dashboard', icon: <FaBoxOpen />, isParent: true },
    {
        name: 'Orders',
        path: '/customer-dashboard/orders',
        icon: <FaShoppingCart />,
        children: [
            { name: 'All Orders', path: '/customer-dashboard/orders', icon: <FaListAlt /> },
            { name: 'Pending', path: '/customer-dashboard/orders/pending', icon: <FaListAlt /> }
        ]
    },
    { name: 'Alerts', path: '/customer-dashboard/alerts', icon: <FaBell /> },
    { name: 'Profile', path: '/customer-dashboard/profile', icon: <FaUserCircle /> }
];

const Sidebar = () => {
    const { user, logout } = useAuth();
    const [menuLinks, setMenuLinks] = useState([]);
    const [compact, setCompact] = useState(false);
    const [alertCount, setAlertCount] = useState(0);
    const [theme, setTheme] = useState('light');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user?.role === 'admin') {
            setMenuLinks(adminItems);
        } else {
            setMenuLinks(customerItems);
        }
    }, [user]);

    useEffect(() => {
        const storedTheme = localStorage.getItem('erpTheme');
        const initialTheme = storedTheme || 'light';
        setTheme(initialTheme);
        document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchAlerts = async () => {
            try {
                const response = await api.get('/api/orders?status=Pending');
                if (response.data.success) {
                    setAlertCount(response.data.orders?.length || 0);
                }
            } catch (error) {
                console.error('Failed to load alert count', error);
            }
        };

        fetchAlerts();
    }, [user, location.pathname]);

    const userInitials = useMemo(() => {
        if (!user?.name) return 'GU';
        return user.name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('');
    }, [user]);

    const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Customer';

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const toggleCompact = () => {
        setCompact((prev) => !prev);
    };

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        localStorage.setItem('erpTheme', nextTheme);
        document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    };

    return (
        <aside className={`fixed top-0 left-0 z-20 flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100 transition-all duration-300 ${compact ? 'w-16' : 'w-64'} md:${compact ? 'w-20' : 'w-64'}`}>
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500 text-base font-semibold text-slate-950">
                        {userInitials}
                    </div>
                    {!compact && (
                        <div>
                            <p className="text-sm font-semibold text-white">{user?.name || 'Guest User'}</p>
                            <p className="text-xs text-slate-400">{roleLabel}</p>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={toggleCompact}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-cyan-500 hover:text-white"
                    title={compact ? 'Expand sidebar' : 'Compact sidebar'}
                >
                    {compact ? <FaBars /> : <FaChevronLeft />}
                </button>
            </div>

            {!compact && (
                <div className="border-b border-slate-800 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                    Main Menu
                </div>
            )}

            <nav className="flex-1 overflow-y-auto px-1 py-2">
                <ul className="space-y-2">
                    {menuLinks.map((item) => {
                        const isParentActive = location.pathname.startsWith(item.path);
                        return (
                            <li key={item.name}>
                                <NavLink
                                    to={item.path}
                                    end={item.isParent}
                                    aria-label={item.name}
                                    className={({ isActive }) =>
                                        `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition duration-200 ${
                                            isActive || isParentActive
                                                ? 'bg-slate-700 text-white shadow-sm border-l-4 border-cyan-500'
                                                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                                        }`
                                    }
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    {!compact && <span className="truncate">{item.name}</span>}
                                    {item.name === 'Alerts' && alertCount > 0 && (
                                        <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                                            {alertCount}
                                        </span>
                                    )}
                                </NavLink>
                                {item.children && !compact && (
                                    <ul className="mt-1 space-y-1 px-6">
                                        {item.children.map((child) => (
                                            <li key={child.name}>
                                                <NavLink
                                                    to={child.path}
                                                    end
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition duration-200 ${
                                                            isActive
                                                                ? 'bg-slate-700 text-white'
                                                                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                                                        }`
                                                    }
                                                >
                                                    <span className="text-base">{child.icon}</span>
                                                    <span>{child.name}</span>
                                                </NavLink>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="border-t border-slate-800 px-1 py-3">
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="group mb-3 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-300 transition duration-200 hover:bg-slate-900 hover:text-white"
                    title="Toggle theme"
                >
                    {theme === 'dark' ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
                    {!compact && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
                </button>
                <button
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-300 transition duration-200 hover:bg-red-600 hover:text-white"
                    title="Logout"
                >
                    <FaSignOutAlt className="text-lg" />
                    {!compact && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
