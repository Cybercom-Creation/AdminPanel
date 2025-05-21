// src/components/SettingsControls.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './SettingsControls.css'; 
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function SettingsControls() {
  const [settings, setSettings] = useState({
    liveVideoStreamEnabled: true,
    noiseDetectionEnabled: true,
    userPhotoFeatureEnabled: true,
    periodicScreenshotsEnabled: true,
    screenshotIntervalSeconds: 300,
    testDurationInterval: 10, // Default to 10 minutes
    googleFormLink: '', // Added for Google Form link
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const { authToken } = useAuth(); // For authenticated requests
  // Memoize headers object to prevent unnecessary re-creation
  const requestHeaders = useMemo(() => {
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  }, [authToken]);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // Clear previous success/error messages on new fetch
    setSuccessMessage('');
    setIsSuccessVisible(false);
    setIsErrorVisible(false);
    try {
      const response = await axios.get(`${API_BASE_URL}/settings`, {
        headers: requestHeaders, // Use memoized headers
      });

      const fetchedSettings = {
        liveVideoStreamEnabled: false,
        noiseDetectionEnabled: false,
        userPhotoFeatureEnabled: false,
        periodicScreenshotsEnabled: false,
        screenshotIntervalSeconds: 300,
        testDurationInterval: 10,
        googleFormLink: '', // Initialize
      };

      if (response.data) {
         // Directly map fetched data to our state structure
        setSettings({
          liveVideoStreamEnabled: response.data.liveVideoStreamEnabled || false,
          noiseDetectionEnabled: response.data.noiseDetectionEnabled || false,
          userPhotoFeatureEnabled: response.data.userPhotoFeatureEnabled || false,
          periodicScreenshotsEnabled: response.data.periodicScreenshotsEnabled || false,
          screenshotIntervalSeconds: response.data.screenshotIntervalSeconds || 300,
          testDurationInterval: response.data.testDurationInterval || 10, // Fetch and set test duration
          googleFormLink: response.data.googleFormLink || '', // Expect this from /settings now
        });
      } else {
        // If response.data is unexpectedly empty, reset to defaults
        setSettings(fetchedSettings); // Reset to initial defaults
      }
    } catch (err) { // This catch is for the primary /settings endpoint
      console.error('Failed to fetch general settings:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load general settings.';
      setError(errorMsg);
      setIsErrorVisible(true);
      setSuccessMessage('');
      setIsSuccessVisible(false);
      // Reset to initial defaults on major fetch error
      setSettings({
        liveVideoStreamEnabled: true,
        noiseDetectionEnabled: true,
        userPhotoFeatureEnabled: true,
        periodicScreenshotsEnabled: true,
        screenshotIntervalSeconds: 300,
        testDurationInterval: 10,
        googleFormLink: '',
      });
    } finally {
      setIsLoading(false);
    }
  }, [requestHeaders, API_BASE_URL]); 

  useEffect(() => {
  //   fetchSettings();
  // }, [fetchSettings]);
  if (authToken) { // Only fetch if authenticated
      fetchSettings();
    }
  }, [fetchSettings, authToken]); // Re-fetch if authToken changes (e.g., login/logout)


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
    setIsErrorVisible(false); 
    setIsSuccessVisible(false); 
    if (settings.periodicScreenshotsEnabled && settings.screenshotIntervalSeconds < 10) {
        setError('Screenshot interval must be at least 10 seconds when enabled.');
        setIsLoading(false);
        setIsErrorVisible(true);
        return;
    }

    
    if (settings.testDurationInterval < 1) { 
        setError('Test duration interval must be at least 5 minutes.');
        setIsLoading(false);
        setIsErrorVisible(true);
        return;
    }
    
    let formLinkEncounteredError = null;

    try {
      // await axios.put(`${API_BASE_URL}/settings`, settings, {
      // 1. Save general settings
      await axios.put(`${API_BASE_URL}/settings`, {
        liveVideoStreamEnabled: settings.liveVideoStreamEnabled,
        noiseDetectionEnabled: settings.noiseDetectionEnabled,
        userPhotoFeatureEnabled: settings.userPhotoFeatureEnabled,
        periodicScreenshotsEnabled: settings.periodicScreenshotsEnabled,
        screenshotIntervalSeconds: settings.screenshotIntervalSeconds,
        testDurationInterval: settings.testDurationInterval,
        googleFormLink: settings.googleFormLink,
      }, {
        headers: requestHeaders, // Use memoized headers
      });
       
      // 2. Validate and Save Google Form link
      const trimmedLink = settings.googleFormLink.trim();
      if (trimmedLink) {
        try {
          new URL(trimmedLink); // Basic URL validation
        } catch (e) {
          formLinkEncounteredError = 'Google Form link is invalid. Please enter a valid URL.';
          // Don't return immediately, let the main save attempt proceed,
          // but the backend should ideally validate this too.
          // Or, we can show an error and prevent submission if the link is invalid.
          setError(formLinkEncounteredError);
          setIsErrorVisible(true);
          setIsLoading(false);
          return; // Prevent submission if link is present but invalid
        }
      }
      // If we reach here, the PUT request to /settings was successful
      setSuccessMessage('Settings updated successfully!');
      setIsSuccessVisible(true);
      setError(null);
      setIsErrorVisible(false);
    } catch (err) {
      console.error('Failed to update settings:', err);
      //setError(err.response?.data?.message || 'Failed to save settings.');
      let finalError = err.response?.data?.message || 'An error occurred while saving settings.';
      setError(finalError);
      setIsErrorVisible(true);
      setSuccessMessage(''); 
      setIsSuccessVisible(false);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        
        setIsSuccessVisible(false);
        setIsErrorVisible(false);
        
        setTimeout(() => {
          setError(null);
          setSuccessMessage('');
        }, 300);
      }, 5000);
    }
  };

  return (
    <div className="settings-controls-container">
      <h4>Application Settings</h4>

      
      <div className="message-area">
        {isLoading && !error && !successMessage && (
          <p className="settings-feedback-message loading visible">Loading current settings...</p>
        )}
        {error && ( // Only render if error string is not empty
          <p className={`settings-feedback-message settings-error ${isErrorVisible ? 'visible' : ''}`}>{error}</p>
        )}
        {successMessage && ( // Only render if successMessage string is not empty
          <p className={`settings-feedback-message settings-success ${isSuccessVisible ? 'visible' : ''}`}>{successMessage}</p>
        )}
      </div>


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
          <input type="number" id="testDurationInterval" name="testDurationInterval" value={settings.testDurationInterval} onChange={handleChange} min="1" disabled={isLoading} required />
        </div>

        {/* Google Form Link */}
        <div className="form-group">
          <label htmlFor="googleFormLink">Google Form Link:</label>
          <input
            type="url"
            id="googleFormLink"
            name="googleFormLink"
            value={settings.googleFormLink}
            onChange={handleChange}
            placeholder="https://docs.google.com/forms/d/e/your-form-id/viewform"
            disabled={isLoading}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} // Basic styling, adjust as needed
          />
        </div>

        <button type="submit" disabled={isLoading} className="save-settings-button">
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

export default SettingsControls;