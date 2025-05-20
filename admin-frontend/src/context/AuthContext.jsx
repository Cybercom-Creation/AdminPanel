// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState(null);

  // Effect to set default Authorization header for axios requests
  useEffect(() => {
    if (authToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [authToken]);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user: loggedInUser } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(loggedInUser)); 
      setAuthToken(token);
      setUser(loggedInUser);
      setIsLoading(false);
      return true; 
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      setIsLoading(false);
     
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setAuthToken(null);
      setUser(null);
      return false; 
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setAuthToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
   
    console.log("User logged out from AuthContext");
    
  };

  

  const value = {
    authToken,
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!authToken, 
    clearError: () => setError(null) 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
  
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
