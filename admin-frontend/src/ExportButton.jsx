// src/ExportButton.jsx
import React, { useState } from 'react';

import EmailDialog from './EmailDialog'; // Import the dialog component (adjust path if needed)
import styles from './ActionButton.module.css';

function ExportButton({ selectedCollegeId }) { // Accept selectedCollegeId
  // State for the API call loading state (affects the button)
  const [isLoading, setIsLoading] = useState(false);
  // Removed message and isError state

  // State specifically for the dialog
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  // Function to open the dialog
  const handleOpenDialog = () => {
    setIsEmailDialogOpen(true);
  };

  // Function to close the dialog
  const handleCloseDialog = () => {
    setIsEmailDialogOpen(false);
  };

  // Function to handle the actual API call - passed to the dialog
  const handleSendExportEmail = async (email) => {
    setIsLoading(true);
    // Removed setMessage calls

    // Use relative path, assuming frontend and backend are on the same domain or proxied
    let backendUrl = `https://adminpanel-p8sw.onrender.com/export`;
    //let backendUrl = "http://localhost:5001/export";
    

    try {
      const requestBody = { email: email };
      if (selectedCollegeId) {
        requestBody.collegeId = selectedCollegeId;
      }
      console.log('[ExportButton] Sending export request with body:', JSON.stringify(requestBody)); // Log the request body

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `HTTP error! Status: ${response.status}`);
      }
      // Consider using a global notification system for success
      console.log('Export initiated successfully!', result.message);
      alert(result.message || 'Export email sent successfully!'); // Simple alert as placeholder
      return { success: true, message: result.message };

    } catch (error) {
      console.error('Error during export request:', error);
      // Consider using a global notification system for error
      alert(`Export Error: ${error.message}`); // Simple alert as placeholder
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Render only the button and the dialog (dialog is likely modal and doesn't affect layout when hidden)
  return (
    <>
      <button
        className={`${styles.actionButton} ${styles.exportButton}`}
        onClick={handleOpenDialog}
        disabled={isLoading}
        title="Send user and log data report via email" // Add a tooltip
      >
        {isLoading && <div className={styles.spinner}></div>}
        {isLoading ? 'Processing...' : 'Export to Email'}
      </button>

      {/* Render the Dialog Component conditionally */}
      {/* The dialog manages its own visibility */}
      <EmailDialog
        isOpen={isEmailDialogOpen}
        onClose={handleCloseDialog}
        onSend={handleSendExportEmail}
      />
    </>
  );
}

export default ExportButton;
