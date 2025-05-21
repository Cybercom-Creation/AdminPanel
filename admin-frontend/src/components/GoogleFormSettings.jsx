// src/components/GoogleFormSettings.jsx
import React, { useState, useEffect } from 'react';
// You might want to create a specific CSS file for this component or use existing global styles
// import './GoogleFormSettings.css';

function GoogleFormSettings() {
  const [formLink, setFormLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Fetch the current Google Form link when the component mounts
  useEffect(() => {
    const fetchCurrentLink = async () => {
      setIsLoading(true);
      setMessage('');
      setMessageType('');
      try {
        const response = await fetch('/api/settings/google-form-link'); // Proxied by Vite
        const data = await response.json();

        if (response.ok && data.success) {
          setFormLink(data.link || ''); // Set to empty string if link is null/undefined
        } else {
          setMessage(data.message || 'Failed to load current Google Form link.');
          setMessageType('error');
          console.warn(data.message || 'No Google Form link found or error fetching.');
        }
      } catch (error) {
        console.error('Error fetching Google Form link:', error);
        setMessage('An error occurred while fetching the link.');
        setMessageType('error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentLink();
  }, []); // Empty dependency array means this runs once on mount

  const handleInputChange = (event) => {
    setFormLink(event.target.value);
  };

  const handleSaveLink = async () => {
    const trimmedLink = formLink.trim();

    if (!trimmedLink) {
      setMessage('Please enter a Google Form link.');
      setMessageType('error');
      return;
    }

    // Basic URL validation (optional, but recommended)
    try {
      new URL(trimmedLink);
      if (!trimmedLink.startsWith('https://docs.google.com/forms/')) {
        // You could add a more specific warning if it's not a Google Forms link
        // but still allow saving if it's a valid URL.
      }
    } catch (e) {
      setMessage('Please enter a valid URL.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('Saving...');
    setMessageType('');

    try {
      const response = await fetch('/api/settings/google-form-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link: trimmedLink }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage(result.message || 'Google Form link saved successfully!');
        setMessageType('success');
      } else {
        setMessage(result.message || 'Failed to save the link.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error saving Google Form link:', error);
      setMessage('An unexpected error occurred while saving.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-form-container" style={{ padding: '20px' }}>
      <h2>Google Form Link Settings</h2>
      <p>Set the Google Form link that will be displayed to candidates after they submit their initial details.</p>

      <div style={{ margin: '20px 0' }}>
        <label htmlFor="googleFormLinkInput" style={{ display: 'block', marginBottom: '5px' }}>Google Form Link:</label>
        <input
          type="url"
          id="googleFormLinkInput"
          value={formLink}
          onChange={handleInputChange}
          placeholder="https://docs.google.com/forms/d/e/your-form-id/viewform"
          disabled={isLoading}
          style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
        />
      </div>

      {message && (
        <div
          className={`message ${messageType}`} // Use your existing message styling classes
          style={{
            margin: '10px 0',
            padding: '10px',
            border: `1px solid ${messageType === 'error' ? 'red' : 'green'}`,
            color: messageType === 'error' ? 'red' : 'green',
            backgroundColor: messageType === 'error' ? '#ffebee' : '#e8f5e9'
          }}
        >
          {message}
        </div>
      )}

      <div>
        <button
          onClick={handleSaveLink}
          className="btn btn-primary" // Use your existing button styles
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Link'}
        </button>
      </div>
    </div>
  );
}

export default GoogleFormSettings;