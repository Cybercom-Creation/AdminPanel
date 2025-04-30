// src/components/EmailDialog.jsx
import React, { useState, useEffect } from 'react';
import './EmailDialog.css'; // Assuming CSS is linked

// Make sure props (isOpen, onClose, onSend) are destructured correctly
function EmailDialog({ isOpen, onClose, onSend }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [isLoading, setIsLoading] = useState(false); // Dialog's internal loading state

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setMessage('');
      setMessageType('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleInputChange = (event) => {
    setEmail(event.target.value);
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose(); // Call the onClose function passed from the parent
    }
  };

  // This is the function that runs when the dialog's "Send" button is clicked
  const handleSend = async () => {
    const trimmedEmail = email.trim();

    // Basic validation
    if (!trimmedEmail) {
      setMessage('Please enter an email address.');
      setMessageType('error');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setMessage('Please enter a valid email address.');
      setMessageType('error');
      return;
    }

    setIsLoading(true); // Use the dialog's loading state
    setMessage('Sending...');
    setMessageType('');

    try {
      // Call the onSend function passed from the parent (ExportButton's handleSendExportEmail)
      const result = await onSend(trimmedEmail);

      if (result.success) {
        setMessage(result.message || 'Export email sent successfully!');
        setMessageType('success');

        // Close the dialog shortly after showing the success message
        setTimeout(() => {
          onClose(); // Call the onClose function passed from the parent
        }, 1500); // Close after 1.5 seconds (adjust timing)

      } else {
        // Error occurred during the API call (result handled by onSend in parent)
        setMessage(result.message || 'An error occurred.');
        setMessageType('error');
        setIsLoading(false); // Stop dialog's loading on error
      }
    } catch (error) {
      // Catch errors from the onSend function prop itself
      console.error('Error calling onSend prop:', error);
      setMessage('An unexpected error occurred.');
      setMessageType('error');
      setIsLoading(false); // Stop dialog's loading on unexpected error
    }
    // No finally block needed here for isLoading, handled in success/error paths
  };

  // Prevent rendering if not open
  if (!isOpen) {
    return null;
  }

  // Handle clicking the overlay to close
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && !isLoading) {
       handleCancel();
    }
  };


  return (
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div className="dialog-box">
        <h2>Export Data</h2>
        <p>Please enter the email address to send the export to:</p>
        <input
          type="email"
          value={email}
          onChange={handleInputChange}
          placeholder="your.email@example.com"
          disabled={isLoading} // Disable input using dialog's loading state
        />
        <div className={`dialog-message ${messageType}`}>
          {message}
        </div>
        <div className="dialog-buttons">
          <button
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isLoading} // Disable button using dialog's loading state
          >
            Cancel
          </button>
          <button
            onClick={handleSend} // This button calls the dialog's handleSend
            className="btn btn-primary"
            disabled={isLoading} // Disable button using dialog's loading state
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailDialog;
