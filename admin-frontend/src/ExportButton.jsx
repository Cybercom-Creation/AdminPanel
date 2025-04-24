// src/ExportButton.jsx
import React, { useState } from 'react';
import styles from './ExportButton.module.css';
import EmailDialog from './EmailDialog'; // Import the dialog component (adjust path if needed)

function ExportButton() {
  // State for the main button feedback (message, loading, error)
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // State specifically for the dialog
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  // Function to open the dialog
  const handleOpenDialog = () => {
    // Reset main button message when opening dialog
    setMessage('');
    setIsError(false);
    setIsEmailDialogOpen(true);
  };

  // Function to close the dialog
  const handleCloseDialog = () => {
    setIsEmailDialogOpen(false);
  };

  // Function to handle the actual API call - passed to the dialog
  const handleSendExportEmail = async (email) => {
    // This function now lives inside ExportButton
    setIsLoading(true); // Use the main button's loading state
    setMessage(`Processing export request for ${email}...`); // Update main button message
    setIsError(false);

    const backendUrl = `https://adminpanel-p8sw.onrender.com/export`; // Backend export endpoint

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }),
      });

      const result = await response.json(); // Get backend response { success: boolean, message: string }

      if (!response.ok) {
        // Use message from backend response if available
        throw new Error(result.message || `HTTP error! Status: ${response.status}`);
      }

      // Update main button message on success
      setMessage(result.message || 'Export initiated successfully!');
      setIsError(false);
      return { success: true, message: result.message }; // Return success to the dialog

    } catch (error) {
      console.error('Error during export request:', error);
      // Update main button message on error
      setMessage(`Error: ${error.message}`);
      setIsError(true);
      return { success: false, message: error.message }; // Return error to the dialog
    } finally {
      setIsLoading(false); // Stop the main button's loading state
    }
  };

  

  const messageClass = isError ? styles.error : styles.success;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Export Data via Email</h2>
      <p className={styles.description}>
        Click the button, enter the recipient email, and the user/log data report (two CSV files) will be sent.
      </p>

      {/* This button now opens the dialog */}
      <button
        className={styles.exportButton}
        onClick={handleOpenDialog} // Changed from handleExport
        disabled={isLoading} // Disable if the API call is in progress
      >
        {/* Keep loading indicator if needed, tied to API call state */}
        {isLoading && <div className={styles.spinner}></div>}
        {isLoading ? 'Processing...' : 'Export Data to Email'}
      </button>

      {/* Display the main feedback message */}
      {message && (
        <p className={`${styles.message} ${messageClass}`}>
          {message}
        </p>
      )}

      {/* Render the Dialog Component conditionally */}
      <EmailDialog
        isOpen={isEmailDialogOpen}
        onClose={handleCloseDialog}
        onSend={handleSendExportEmail} // Pass the API call handler
      />
    </div>
  );
}

export default ExportButton;
