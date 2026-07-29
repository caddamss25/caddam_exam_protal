import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('caddamss_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    
    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('caddamss_user', JSON.stringify(userData));
    };
    
    const logout = () => {
        setUser(null);
        localStorage.removeItem('caddamss_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
