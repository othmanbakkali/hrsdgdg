import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore and verify session from sessionStorage or localStorage
  useEffect(() => {
    const restoreSession = async () => {
      // 1. Clean up old insecure legacy storage
      localStorage.removeItem('oria_admin_user');

      // 2. Read active session from sessionStorage (tab/session scope) or localStorage (if remember me was active)
      let storedSession = null;
      try {
        const sessionData = sessionStorage.getItem('oria_admin_session');
        if (sessionData) {
          storedSession = JSON.parse(sessionData);
        } else {
          const localData = localStorage.getItem('oria_admin_session');
          if (localData) {
            storedSession = JSON.parse(localData);
          }
        }
      } catch (e) {
        console.error('Error reading stored admin session:', e);
      }

      if (!storedSession || !storedSession.sessionToken) {
        setAdminUser(null);
        setSessionToken(null);
        setLoading(false);
        return;
      }

      // Check client-side expiration
      if (storedSession.expiresAt && Date.now() > storedSession.expiresAt) {
        sessionStorage.removeItem('oria_admin_session');
        localStorage.removeItem('oria_admin_session');
        setAdminUser(null);
        setSessionToken(null);
        setLoading(false);
        return;
      }

      // 3. Verify session token with backend API
      try {
        const res = await fetch(`${API_URL}/auth/verify-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedSession.sessionToken}`
          },
          body: JSON.stringify({ token: storedSession.sessionToken })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.valid && data.user && (data.user.role === 'admin' || data.user.role === 'commercant')) {
            setAdminUser(data.user);
            setSessionToken(storedSession.sessionToken);
            setLoading(false);
            return;
          }
        } else if (res.status === 401 || res.status === 403) {
          // Token is explicitly expired or invalid according to backend
          sessionStorage.removeItem('oria_admin_session');
          localStorage.removeItem('oria_admin_session');
          setAdminUser(null);
          setSessionToken(null);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Admin session backend check network error:', err.message);
        // Fallback gracefully on temporary network issues if cached session is still valid
        if (storedSession.user && (storedSession.user.role === 'admin' || storedSession.user.role === 'commercant')) {
          setAdminUser(storedSession.user);
          setSessionToken(storedSession.sessionToken);
          setLoading(false);
          return;
        }
      }

      // If session verification failed or token is invalid, wipe session
      sessionStorage.removeItem('oria_admin_session');
      localStorage.removeItem('oria_admin_session');
      setAdminUser(null);
      setSessionToken(null);
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, rememberMe })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Identifiants incorrects.');
      }

      const userData = await res.json();
      if (userData.role !== 'admin' && userData.role !== 'commercant') {
        throw new Error("Accès refusé : Cet espace est réservé aux administrateurs et commerçants partenaires.");
      }

      const sessionObj = {
        user: userData,
        sessionToken: userData.sessionToken,
        expiresAt: userData.expiresAt
      };

      setAdminUser(userData);
      setSessionToken(userData.sessionToken);

      // Clean old legacy storage
      localStorage.removeItem('oria_admin_user');

      if (rememberMe) {
        localStorage.setItem('oria_admin_session', JSON.stringify(sessionObj));
        sessionStorage.removeItem('oria_admin_session');
      } else {
        sessionStorage.setItem('oria_admin_session', JSON.stringify(sessionObj));
        localStorage.removeItem('oria_admin_session');
      }

      return userData;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = sessionToken || (() => {
        try {
          const s = sessionStorage.getItem('oria_admin_session') || localStorage.getItem('oria_admin_session');
          return s ? JSON.parse(s)?.sessionToken : null;
        } catch {
          return null;
        }
      })();

      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ token })
        }).catch(() => {});
      }
    } finally {
      setAdminUser(null);
      setSessionToken(null);
      sessionStorage.removeItem('oria_admin_session');
      localStorage.removeItem('oria_admin_session');
      localStorage.removeItem('oria_admin_user');
    }
  };

  // Authenticated fetch wrapper for admin requests
  const authFetch = useCallback(async (url, options = {}) => {
    const token = sessionToken || (() => {
      try {
        const s = sessionStorage.getItem('oria_admin_session') || localStorage.getItem('oria_admin_session');
        return s ? JSON.parse(s)?.sessionToken : null;
      } catch {
        return null;
      }
    })();

    const headers = {
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      logout();
      throw new Error("Session expirée. Veuillez vous reconnecter.");
    }
    return res;
  }, [sessionToken]);

  return (
    <AuthContext.Provider value={{ adminUser, sessionToken, login, logout, authFetch, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

