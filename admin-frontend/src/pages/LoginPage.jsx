// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // Adjust the import path as necessary
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './LoginPage.css'; // Create this CSS file for styling

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination path from the router state, or default to dashboard
  const from = location.state?.from?.pathname || '/'; // Redirect to UserTable (or your main dashboard route)

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearError(); // Clear previous errors
    const success = await login(email, password);
    if (success) {
      navigate(from, { replace: true }); // Redirect to intended page after login
    }
    // Error state is handled by the AuthContext and displayed below
  };

  // Simple Alert Overlay (can be extracted to a separate component)
  const AlertOverlay = ({ message, onClose }) => (
    <div className="alert-overlay">
      <div className="alert-content">
        <p>{message}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Admin Login</h2>
        {error && <AlertOverlay message={error} onClose={clearError} />}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading} className="login-button">
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        <div className="forgot-password">
          {/* TODO: Implement Forgot Password functionality */}
          <Link to="/forgot-password">Forgot Password?</Link> {/* Use Link component */}
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
