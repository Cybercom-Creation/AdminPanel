// src/services/api.js 
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const fetchAdminUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`); 
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    return data.map(user => ({
        ...user,
        // Ensure necessary fields exist, provide defaults if needed
        id: user.id || 'N/A',
        name: user.name || 'Unknown User',
        smallPicUrl: user.smallPicUrl || '/path/to/default/small-avatar.png', // Provide a default avatar
        largePicUrl: user.largePicUrl || '/path/to/default/large-avatar.png',
        testDuration: user.testDuration || 0, 
        violations: user.violations || {}, 
        violationDetails: user.violationDetails || [], 
        driveFolderLink: user.driveFolderLink || null,
        totalViolations: Object.values(user.violations || {}).reduce((sum, count) => sum + count, 0) // Calculate total for sorting
    }));
  } catch (error) {
    console.error("Error fetching admin users:", error);
    
    return []; 
  }
};

// *** formatDuration function ***
export const formatDuration = (ms) => {
 
  // Ensure ms is treated as a number
  const numericMs = typeof ms === 'string' ? parseInt(ms, 10) : ms;

  if (typeof numericMs !== 'number' || isNaN(numericMs) || numericMs < 0) {
     
      return "N/A"; 
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
  
  formatted += `${seconds}s`;

  return formatted.trim(); 
};




export const formatViolations = (violations) => {
    if (!violations || Object.keys(violations).length === 0) return 'None';
    return Object.entries(violations)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ');
};





