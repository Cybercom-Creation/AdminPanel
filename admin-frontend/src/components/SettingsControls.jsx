// src/components/SettingsControls.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './SettingsControls.css'; // Create this CSS file for styling

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function SettingsControls() {
  const [settings, setSettings] = useState({
    liveVideoStreamEnabled: true,
    noiseDetectionEnabled: true,
    userPhotoFeatureEnabled: true,
    periodicScreenshotsEnabled: true,
    screenshotIntervalSeconds: 300,
    testDurationInterval: 10, // Default to 10 minutes
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { authToken } = useAuth(); // For authenticated requests

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/settings`, {
        // No auth token needed if GET /settings is public,
        // otherwise, add: headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.data) {
        setSettings({
          liveVideoStreamEnabled: response.data.liveVideoStreamEnabled || false,
          noiseDetectionEnabled: response.data.noiseDetectionEnabled || false,
          userPhotoFeatureEnabled: response.data.userPhotoFeatureEnabled || false,
          periodicScreenshotsEnabled: response.data.periodicScreenshotsEnabled || false,
          screenshotIntervalSeconds: response.data.screenshotIntervalSeconds || 300,
          testDurationInterval: response.data.testDurationInterval || 10, // Fetch and set test duration
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError(err.response?.data?.message || 'Failed to load settings.');
    } finally {
      setIsLoading(false);
    }
  }, [authToken]); // Add authToken if used in headers

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSettings((prevSettings) => ({
      ...prevSettings,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) : value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');

    if (settings.periodicScreenshotsEnabled && settings.screenshotIntervalSeconds < 10) {
        setError('Screenshot interval must be at least 10 seconds when enabled.');
        setIsLoading(false);
        return;
    }

    // Optional: Client-side validation for testDurationInterval
    if (settings.testDurationInterval < 5) { // Assuming 5 is the minimum
        setError('Test duration interval must be at least 5 minutes.');
        setIsLoading(false);
        return;
    }

    try {
      await axios.put(`${API_BASE_URL}/settings`, settings, {
        // No auth token needed if PUT /settings is public or uses a different auth scheme for admin actions
        // otherwise, add: headers: { Authorization: `Bearer ${authToken}` },
      });
      setSuccessMessage('Settings updated successfully!');
      // fetchSettings(); // Optionally re-fetch to confirm
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setError(null);
        setSuccessMessage('');
      }, 5000);
    }
  };

  return (
    <div className="settings-controls-container">
      <h4>Application Settings</h4>

      
      {isLoading && !error && <p>Loading current settings...</p>}
      {error && <p className="settings-error">{error}</p>}
      {successMessage && <p className="settings-success">{successMessage}</p>}
      {/* Placeholder for spacing when no message and not loading */}
      {!isLoading && !error && !successMessage && <p className="message-placeholder">&nbsp;</p>}


       <form onSubmit={handleSubmit} className="settings-form">
        {/* Live Video Stream */}
        <div className="form-group checkbox-group">
          <label htmlFor="liveVideoStreamEnabled">Live Video Stream:</label>
          <input type="checkbox" id="liveVideoStreamEnabled" name="liveVideoStreamEnabled" checked={settings.liveVideoStreamEnabled} onChange={handleChange} disabled={isLoading} />
        </div>

        {/* Noise Detection */}
        <div className="form-group checkbox-group">
          <label htmlFor="noiseDetectionEnabled">Noise Detection:</label>
          <input type="checkbox" id="noiseDetectionEnabled" name="noiseDetectionEnabled" checked={settings.noiseDetectionEnabled} onChange={handleChange} disabled={isLoading} />
        </div>

        {/* User Photo Feature */}
        <div className="form-group checkbox-group">
          <label htmlFor="userPhotoFeatureEnabled">User Photo Feature:</label>
          <input type="checkbox" id="userPhotoFeatureEnabled" name="userPhotoFeatureEnabled" checked={settings.userPhotoFeatureEnabled} onChange={handleChange} disabled={isLoading} />
        </div>
        
        {/* Capture Screenshots */}
        <div className="form-group checkbox-group">
          <label htmlFor="periodicScreenshotsEnabled">Capture Screenshots:</label>
          <input type="checkbox" id="periodicScreenshotsEnabled" name="periodicScreenshotsEnabled" checked={settings.periodicScreenshotsEnabled} onChange={handleChange} disabled={isLoading} />
        </div>

        {/* Screenshot Interval */}
        {settings.periodicScreenshotsEnabled && (
          <div className="form-group checkbox-group">
            <label htmlFor="screenshotIntervalSeconds">Interval (seconds):</label>
            <input type="number" id="screenshotIntervalSeconds" name="screenshotIntervalSeconds" value={settings.screenshotIntervalSeconds} onChange={handleChange} min="10" disabled={isLoading} required />
          </div>
        )}

        {/* Test Duration Interval */}
        <div className="form-group checkbox-group">
          <label htmlFor="testDurationInterval">Test Duration Interval (minutes):</label>
          <input type="number" id="testDurationInterval" name="testDurationInterval" value={settings.testDurationInterval} onChange={handleChange} min="5" disabled={isLoading} required />
        </div>

        <button type="submit" disabled={isLoading} className="save-settings-button">
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

export default SettingsControls;