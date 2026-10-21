
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("?action=me")
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

 const login = async (email, password) => {
  const res = await api.post("?action=login", {
    email,
    password
  });

  setUser(res.data.user);
  return res.data;
};

  const register = async (details) => {
    const res = await api.post("?action=register", details);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("?action=logout");
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
