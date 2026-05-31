
import { NavLink } from 'react-router-dom';
import { FaHome, FaUser, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const adminItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <FaHome />, isParent: true },
    { name: 'Category', path: '/admin/categories', icon: <FaHome /> },
    { name: 'Products', path: '/admin/products', icon: <FaHome /> },
    { name: 'Supplier', path: '/admin/suppliers', icon: <FaHome /> },
    { name: 'Orders', path: '/admin/orders', icon: <FaHome /> },
    { name: 'Users', path: '/admin/users', icon: <FaHome /> },
    { name: 'Profile', path: '/admin/profile', icon: <FaUser /> }
];

const customerItems = [
    { name: 'Products', path: '/customer-dashboard', icon: <FaHome />, isParent: true },
    { name: 'Orders', path: '/customer-dashboard/orders', icon: <FaHome /> },
    { name: 'Profile', path: '/customer-dashboard/profile', icon: <FaUser /> }
];

const Sidebar = () => {
    const { user, logout } = useAuth();
    const [menuLinks, setMenuLinks] = useState([]);

    useEffect(() => {
        if (user?.role === 'admin') {
            setMenuLinks(adminItems);
        } else {
            setMenuLinks(customerItems);
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        localStorage.removeItem("POS_token");
    };

    return (
        <div className="flex flex-col h-screen p-3 bg-black text-white w-16 md:w-64 fixed">

            <div className="h-16 flex items-center justify-center">
                <span className="hidden md:block text-xl font-bold">
                    Inventory MS
                </span>
                <span className="md:hidden text-xl font-bold">
                    IMS
                </span>
            </div>

            <ul className="space-y-2 p-2">
                {menuLinks.map((item) => (
                    <li key={item.name}>
                        <NavLink
                            to={item.path}
                            end={item.isParent}
                            className={({ isActive }) =>
                                `flex items-center p-2 rounded-md transition duration-200 ${
                                    isActive ? "bg-gray-700" : ""
                                }`
                            }
                        >
                            <span>{item.icon}</span>
                            <span className="text-xl hidden md:block ml-4">
                                {item.name}
                            </span>
                        </NavLink>
                    </li>
                ))}
            </ul>

            <div className="mt-auto p-2">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full p-2 rounded-md transition duration-200 hover:bg-red-600"
                >
                    <FaSignOutAlt />
                    <span className="text-xl hidden md:block ml-4">
                        Logout
                    </span>
                </button>
            </div>

        </div>
    );
};

export default Sidebar;