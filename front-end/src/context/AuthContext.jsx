

/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

/* eslint-disable react/prop-types */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('POS_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const login = (userData, token) => {
        const fullUser = {
            ...userData,
            token,
        };

        setUser(fullUser);
        localStorage.setItem('POS_user', JSON.stringify(fullUser));
        localStorage.setItem('POS_token', token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('POS_user');
        localStorage.removeItem('POS_token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

export default AuthContext;