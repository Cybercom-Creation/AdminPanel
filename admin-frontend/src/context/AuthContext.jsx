// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios'; // Or your preferred HTTP client

const AuthContext = createContext(null);

// Define backend API URL (use environment variables for flexibility)
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001'; // Adjust port if needed
// Use Vite's import.meta.env for client-side environment variables
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'; // Adjust port and path if needed
const API_URL = process.env.VITE_API_URL || 'http://localhost:5001'; // Adjust port and path if needed


export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [isLoading, setIsLoading] = useState(false); // Optional: for loading states
  const [error, setError] = useState(null);

  // Effect to set default Authorization header for axios requests
  useEffect(() => {
    if (authToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      // Optionally verify token validity with backend here
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
      localStorage.setItem('user', JSON.stringify(loggedInUser)); // Store user info
      setAuthToken(token);
      setUser(loggedInUser);
      setIsLoading(false);
      return true; // Indicate success
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      setIsLoading(false);
      // Clear any potentially stale token/user info on failure
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setAuthToken(null);
      setUser(null);
      return false; // Indicate failure
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setAuthToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    // Optionally: redirect to login page via router history or state change
    console.log("User logged out from AuthContext");
    // navigate('/login'); // Remove this - navigation will be handled by the calling component
  };

  const value = {
    authToken,
    user,
    isLoading,
    error,
    login,
    logout,
    isAuthenticated: !!authToken, // Simple check if token exists
    clearError: () => setError(null) // Function to clear error message
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
