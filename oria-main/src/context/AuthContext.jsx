import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from storage if present
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('oria_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur d\'authentification');
      }
      const data = await res.json();
      setUser(data);
      localStorage.setItem('oria_user', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur d\'inscription');
      }
      const data = await res.json();
      setUser(data);
      localStorage.setItem('oria_user', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('oria_user');
  };

  // Dynamic Switcher for testing all flows in one PWA view
  const switchEvalRole = (roleType) => {
    let mockUser = null;
    if (roleType === 'visitor') {
      mockUser = null;
    } else if (roleType === 'client') {
      mockUser = {
        id: "u_client1",
        email: "client@oria.com",
        nom: "Yassine Alami",
        role: "client",
        favoris: ["b_2"]
      };
    } else if (roleType === 'merchant1') {
      mockUser = {
        id: "u_merchant1",
        email: "gold@oria.com",
        nom: "El Fassi Or",
        role: "commercant",
        shopName: "Maison El Fassi",
        phone: "+212 661-123456",
        address: "25 Bd d'Anfa",
        city: "Casablanca"
      };
    } else if (roleType === 'merchant2') {
      mockUser = {
        id: "u_merchant2",
        email: "watch@oria.com",
        nom: "Maroc Horlogerie",
        role: "commercant",
        shopName: "Maroc Chrono",
        phone: "+212 662-789012",
        address: "45 Av. Mohammed V",
        city: "Rabat"
      };
    }
    
    setUser(mockUser);
    if (mockUser) {
      localStorage.setItem('oria_user', JSON.stringify(mockUser));
    } else {
      localStorage.removeItem('oria_user');
    }
  };

  const toggleFavorite = async (itemId) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/users/${user.id}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });
      if (res.ok) {
        const updatedFavorites = await res.json();
        const updatedUser = { ...user, favoris: updatedFavorites };
        setUser(updatedUser);
        localStorage.setItem('oria_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, switchEvalRole, toggleFavorite, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
