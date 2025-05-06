// src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ResetPasswordPage.css'; // Create this CSS file

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function ResetPasswordPage() {
  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) { // Basic password length check
        setError('Password must be at least 6 characters long.');
        return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/reset-password/${token}`, { password });
      setMessage(response.data.message);
      // Optionally clear form or redirect after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000); // Redirect to login after 3 seconds
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred. The link may be invalid or expired.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <form onSubmit={handleSubmit} className="reset-password-form">
        <h2>Reset Your Password</h2>

        {message && <div className="message success-message">{message}</div>}
        {error && <div className="message error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="password">New Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading || !!message} // Disable if successful
            placeholder="Enter new password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading || !!message}
            placeholder="Confirm new password"
          />
        </div>

        <button type="submit" disabled={isLoading || !!message} className="submit-button">
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>

        {message && <div className="back-to-login"><Link to="/login">Back to Login</Link></div>}
      </form>
    </div>
  );
}

export default ResetPasswordPage;