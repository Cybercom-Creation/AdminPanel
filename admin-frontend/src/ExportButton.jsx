// src/ExportButton.jsx
import React, { useState } from 'react';

import EmailDialog from './EmailDialog'; 
import styles from './ActionButton.module.css';


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'; // Use environment variable
function ExportButton({ selectedCollegeId }) { 
  const [isLoading, setIsLoading] = useState(false);
  
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
    
    let backendUrl = `${API_BASE_URL}/export`; // Use environment variable
    

    try {
      const requestBody = { email: email };
      if (selectedCollegeId) {
        requestBody.collegeId = selectedCollegeId;
      }
      console.log('[ExportButton] Sending export request with body:', JSON.stringify(requestBody)); 

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || `HTTP error! Status: ${response.status}`);
      }
     
      console.log('Export initiated successfully!', result.message);
      alert(result.message || 'Export email sent successfully!'); 
      return { success: true, message: result.message };

    } catch (error) {
      console.error('Error during export request:', error);
      
      alert(`Export Error: ${error.message}`);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  
  return (
    <>
      <button
        className={`${styles.actionButton} ${styles.exportButton}`}
        onClick={handleOpenDialog}
        disabled={isLoading}
        title="Send user and log data report via email"
      >
        {isLoading && <div className={styles.spinner}></div>}
        {isLoading ? 'Processing...' : 'Export to Email'}
      </button>

      
      <EmailDialog
        isOpen={isEmailDialogOpen}
        onClose={handleCloseDialog}
        onSend={handleSendExportEmail}
      />
    </>
  );
}

export default ExportButton;
