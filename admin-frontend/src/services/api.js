// src/services/api.js (or wherever your API calls live)

// Assuming your backend endpoint is /api/admin/users
const API_BASE_URL = 'http://localhost:5001'; // Replace with your actual backend URL

export const fetchAdminUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users`); // Adjust endpoint if needed
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Optional: Pre-process data if needed (e.g., calculate total violations)
    return data.map(user => ({
        ...user,
        // Ensure necessary fields exist, provide defaults if needed
        id: user.id || 'N/A',
        name: user.name || 'Unknown User',
        smallPicUrl: user.smallPicUrl || '/path/to/default/small-avatar.png', // Provide a default avatar
        largePicUrl: user.largePicUrl || '/path/to/default/large-avatar.png',
        testDuration: user.testDuration || 0, // Assuming duration is in seconds
        violations: user.violations || {}, // e.g., { faceMismatch: 2, phoneDetected: 1 }
        violationDetails: user.violationDetails || [], // e.g., [{ type: '...', timestamp: '...', details: '...' }]
        driveFolderLink: user.driveFolderLink || null,
        totalViolations: Object.values(user.violations || {}).reduce((sum, count) => sum + count, 0) // Calculate total for sorting
    }));
  } catch (error) {
    console.error("Error fetching admin users:", error);
    // Handle error appropriately in UI (e.g., show message)
    return []; // Return empty array on error
  }
};

// *** NEW formatDuration function (from your suggestion) ***
export const formatDuration = (ms) => {
  // Add console log for debugging input
  console.log(`formatDuration (new) received: ${ms} (type: ${typeof ms})`);

  // Ensure ms is treated as a number
  const numericMs = typeof ms === 'string' ? parseInt(ms, 10) : ms;

  if (typeof numericMs !== 'number' || isNaN(numericMs) || numericMs < 0) {
      console.warn(`formatDuration (new) defaulting to "N/A" for input: ${ms}`);
      return "N/A"; // Return "N/A" for invalid or missing data
  }
  if (numericMs < 1000) {
      return `${numericMs} ms`;
  }

  const totalSeconds = Math.floor(numericMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  let formatted = "";
  if (minutes > 0) {
      formatted += `${minutes}m `;
  }
  // Always show seconds if total duration is >= 1 second
  formatted += `${seconds}s`;

  return formatted.trim(); // Trim any trailing space if minutes is 0
};



// Helper function to format violations object - place it here or in a utils file
export const formatViolations = (violations) => {
    if (!violations || Object.keys(violations).length === 0) return 'None';
    return Object.entries(violations)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ');
};





