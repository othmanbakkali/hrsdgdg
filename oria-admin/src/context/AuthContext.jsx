import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5077/api';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('oria_admin_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role === 'admin') {
          setAdminUser(parsed);
        } else {
          localStorage.removeItem('oria_admin_user');
        }
      }
    } catch (e) {
      console.error('Error restoring admin session:', e);
      localStorage.removeItem('oria_admin_user');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Identifiants incorrects.');
      }

      const userData = await res.json();
      if (userData.role !== 'admin') {
        throw new Error("Accès refusé : Ce compte ne possède pas les privilèges d'administrateur.");
      }

      setAdminUser(userData);
      localStorage.setItem('oria_admin_user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setAdminUser(null);
    localStorage.removeItem('oria_admin_user');
  };

  return (
    <AuthContext.Provider value={{ adminUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
