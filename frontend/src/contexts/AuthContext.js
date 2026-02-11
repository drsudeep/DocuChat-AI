import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API = "http://127.0.0.1:8000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const signup = async (email, password, fullName) => {
    const response = await axios.post(`${API}/auth/signup`, {
      email,
      password,
      full_name: fullName
    });

    const { token: newToken, user: newUser } = response.data;

    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);

    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });

    const { token: newToken, user: newUser } = response.data;

    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);

    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signup,
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
