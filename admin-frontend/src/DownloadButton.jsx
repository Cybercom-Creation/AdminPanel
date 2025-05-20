import React, { useState } from 'react';
// You can create a separate CSS module or reuse/adapt ExportButton.module.css
 // Reusing styles for simplicity
import styles from './ActionButton.module.css'; // Assuming you have a CSS module for button styles

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'; // Use environment variable

function DownloadButton({ selectedCollegeId }) { // Accept selectedCollegeId
  const [isLoading, setIsLoading] = useState(false);
  // Removed message and isError state as we are only rendering the button

  const handleDownload = async () => {
    setIsLoading(true);
    // Removed setMessage calls

    //let backendUrl = `https://adminpanel-p8sw.onrender.com/download`; // Backend download endpoint
    //let backendUrl = "http://localhost:5001/download";
    let backendUrl = `${API_BASE_URL}/download`; // Use environment variable
   

    if (selectedCollegeId) {
      backendUrl += `?collegeId=${selectedCollegeId}`;
    }
    console.log('[DownloadButton] Requesting download from URL:', backendUrl); // Log the final URL

    try {
      const response = await fetch(backendUrl);

      if (!response.ok) {
        let errorMsg = `File generation failed. Status: ${response.status}`;
        try {
          const errorText = await response.text();
          if (errorText) errorMsg = errorText;
        } catch (e) { /* Ignore */ }
        throw new Error(errorMsg);
      }

      // --- Handle File Download ---
      const disposition = response.headers.get('content-disposition');
      let filename = `admin_export_${Date.now()}.zip`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      // --- End File Download Handling ---

      // Consider using a global notification system for success/error messages
      console.log('Download started successfully!');

    } catch (error) {
      console.error('Error during download request:', error);
      // Consider using a global notification system for error messages
      alert(`Download Error: ${error.message}`); // Simple alert as placeholder
    } finally {
      setIsLoading(false);
    }
  };

  // Render only the button
  return (
    <button
      className={`${styles.actionButton} ${styles.downloadButton}`}
      onClick={handleDownload}
      disabled={isLoading}
      title="Download user and log data as CSV files (.zip)" // Add a tooltip
    >
      {isLoading && <div className={styles.spinner}></div>}
      {isLoading ? 'Generating...' : 'Download Report'}
    </button>
  );
}


export default DownloadButton;
