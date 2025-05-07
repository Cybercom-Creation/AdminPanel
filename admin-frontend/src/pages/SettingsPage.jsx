// src/pages/SettingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // To get API_URL if needed, or set axios base URL
import './SettingsPage.css'; // Create this CSS file for styling

// Define API_URL - it's better to have this configured globally in your AuthContext or an api.js utility
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function SettingsPage() {
  const [settings, setSettings] = useState({
    liveVideoStreamEnabled: true,
    noiseDetectionEnabled: true,
    userPhotoFeatureEnabled: true,
    periodicScreenshotsEnabled: false,
    screenshotIntervalSeconds: 300,
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
        headers: { Authorization: `Bearer ${authToken}` }, // Assuming routes are protected
      });
      if (response.data) {
        setSettings({
          liveVideoStreamEnabled: response.data.liveVideoStreamEnabled || false,
          noiseDetectionEnabled: response.data.noiseDetectionEnabled || false,
          userPhotoFeatureEnabled: response.data.userPhotoFeatureEnabled || false,
          periodicScreenshotsEnabled: response.data.periodicScreenshotsEnabled || false,
          screenshotIntervalSeconds: response.data.screenshotIntervalSeconds || 300,
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError(err.response?.data?.message || 'Failed to load settings.');
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

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

    try {
      await axios.put(`${API_BASE_URL}/settings`, settings, {
        headers: { Authorization: `Bearer ${authToken}` }, // Assuming routes are protected
      });
      setSuccessMessage('Settings updated successfully!');
      // Optionally re-fetch settings to confirm, though backend should return updated
      // fetchSettings();
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setIsLoading(false);
      setTimeout(() => { // Clear messages after a few seconds
        setError(null);
        setSuccessMessage('');
      }, 5000);
    }
  };

  if (isLoading && !settings.identifier) { // Show full page loader only on initial load
    return <div className="settings-container"><p>Loading settings...</p></div>;
  }

  return (
    <div className="settings-container">
      <h2>Application Settings</h2>
      {error && <p className="settings-error">{error}</p>}
      {successMessage && <p className="settings-success">{successMessage}</p>}
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label htmlFor="liveVideoStreamEnabled">
            Live Video Stream:
          </label>
          <input
            type="checkbox"
            id="liveVideoStreamEnabled"
            name="liveVideoStreamEnabled"
            checked={settings.liveVideoStreamEnabled}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="noiseDetectionEnabled">
            Noise Detection:
          </label>
          <input
            type="checkbox"
            id="noiseDetectionEnabled"
            name="noiseDetectionEnabled"
            checked={settings.noiseDetectionEnabled}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="userPhotoFeatureEnabled">
            User Photo Feature (Capture/Upload):
          </label>
          <input
            type="checkbox"
            id="userPhotoFeatureEnabled"
            name="userPhotoFeatureEnabled"
            checked={settings.userPhotoFeatureEnabled}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="periodicScreenshotsEnabled">
            Capture Periodic Screenshots:
          </label>
          <input
            type="checkbox"
            id="periodicScreenshotsEnabled"
            name="periodicScreenshotsEnabled"
            checked={settings.periodicScreenshotsEnabled}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        {settings.periodicScreenshotsEnabled && (
          <div className="form-group">
            <label htmlFor="screenshotIntervalSeconds">
              Screenshot Interval (seconds):
            </label>
            <input
              type="number"
              id="screenshotIntervalSeconds"
              name="screenshotIntervalSeconds"
              value={settings.screenshotIntervalSeconds}
              onChange={handleChange}
              min="10" // Minimum interval
              disabled={isLoading}
              required
            />
          </div>
        )}

        <button type="submit" disabled={isLoading} className="save-settings-button">
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

export default SettingsPage;
