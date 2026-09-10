import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-login seeded administrator Sophia Bennani for immediate access
    const defaultAdmin = {
      id: "u_admin",
      email: "admin@oria.com",
      nom: "Sophia Bennani",
      role: "admin"
    };
    setAdminUser(defaultAdmin);
    setLoading(false);
  }, []);

  const logout = () => {
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider value={{ adminUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
