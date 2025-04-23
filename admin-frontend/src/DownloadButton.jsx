import React, { useState } from 'react';
// You can create a separate CSS module or reuse/adapt ExportButton.module.css
import styles from './ExportButton.module.css'; // Reusing styles for simplicity

function DownloadButton() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    setMessage('Generating files for download...');
    setIsError(false);

    const backendUrl = `${process.env.REACT_APP_API_BASE_URL}/download`; // Backend download endpoint

    try {
      const response = await fetch(backendUrl); // Simple GET request

      if (!response.ok) {
        // Try to get error text if possible (backend might send plain text on error)
        let errorMsg = `File generation failed. Status: ${response.status}`;
        try {
            const errorText = await response.text(); // Get error as text
            if (errorText) errorMsg = errorText;
        } catch(e) {/* Ignore */}
        throw new Error(errorMsg);
      }

      // --- Handle File Download ---
      // Get the filename from the Content-Disposition header if possible
      const disposition = response.headers.get('content-disposition');
      let filename = `admin_export_${Date.now()}.zip`; // Default filename
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Get the response body as a Blob (binary large object)
      const blob = await response.blob();

      // Create a temporary URL for the blob object
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename; // Use the extracted or default filename
      document.body.appendChild(a); // Append the anchor to the body
      a.click(); // Simulate a click on the anchor
      a.remove(); // Remove the anchor from the body
      window.URL.revokeObjectURL(url); // Release the object URL
      // --- End File Download Handling ---

      setMessage('Download started successfully!');
      setIsError(false);

    } catch (error) {
      console.error('Error during download request:', error);
      setMessage(`Error: ${error.message}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const messageClass = isError ? styles.error : styles.success;

  return (
    // Using similar styling structure
    <div className={styles.container} style={{marginTop: '20px'}}> {/* Added margin top */}
      <h2 className={styles.title}>Download Data Report</h2>
      <p className={styles.description}>
        Click the button to download a zip file containing the user/log data report (two CSV files).
      </p>

      <button
        className={styles.exportButton} // Reuse button style or create a new one
        style={{backgroundColor: '#28a745', borderColor: '#28a745'}} // Example: Green color
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'} // Hover effect
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'} // Hover effect
        onClick={handleDownload}
        disabled={isLoading}
      >
        {isLoading && <div className={styles.spinner}></div>}
        {isLoading ? 'Generating...' : 'Download Report (.zip)'}
      </button>

      {message && (
        <p className={`${styles.message} ${messageClass}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default DownloadButton;
