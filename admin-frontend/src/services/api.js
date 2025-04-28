// src/services/api.js (or wherever your API calls live)

// Assuming your backend endpoint is /api/admin/users
const API_BASE_URL = 'https://adminpanel-p8sw.onrender.com'; // Replace with your actual backend URL

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
        screenshotFolderUrl: user.screenshotFolderUrl || null,
        totalViolations: Object.values(user.violations || {}).reduce((sum, count) => sum + count, 0) // Calculate total for sorting
    }));
  } catch (error) {
    console.error("Error fetching admin users:", error);
    // Handle error appropriately in UI (e.g., show message)
    return []; // Return empty array on error
  }
};

// Helper function to format duration (seconds to HH:MM:SS) - place it here or in a utils file
export const formatDuration = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || totalSeconds < 0) {
        return '00:00:00';
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};

// Helper function to format violations object - place it here or in a utils file
export const formatViolations = (violations) => {
    if (!violations || Object.keys(violations).length === 0) return 'None';
    return Object.entries(violations)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ');
};





