// src/components/UserRow.jsx
import React, { useState } from 'react';
import { formatDuration, formatViolations } from '../services/api'; // Adjust path if needed
import './UserRow.css'; // We'll create this CSS file next

function UserRow({ user }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Optional: Log the received user prop to verify its structure in the browser console
  // console.log('UserRow received user:', user);

  // Basic check in case user prop is somehow invalid
  if (!user || !user.id) {
    console.warn("UserRow received invalid user prop:", user);
    return (
        <tr>
            <td colSpan="7">Invalid user data</td> {/* Adjust colSpan */}
        </tr>
    );
  }

  

  return (
    <>
      {/* Main Data Row */}
      <tr className="user-row">
        <td>{user.id}</td>
        {/* Cell containing the avatar with hover effect */}
        <td className="user-pic-cell">
          {/* Container for positioning the tooltip */}
          <div className="tooltip-container">
             <img
                src={user.smallPicUrl || '/default-avatar.png'} // Use fallback
                alt={`${user.name}'s avatar`}
                className="user-avatar-small"
                onError={(e) => { e.target.onerror = null; e.target.src='/default-avatar.png'; }} // Handle broken images
             />
             {/* The tooltip content (large image) */}
             <div className="tooltip-content">
                 <img
                    src={user.largePicUrl || '/default-avatar.png'} // Use fallback
                    alt={`${user.name}'s avatar (large)`}
                    className="user-avatar-large"
                    onError={(e) => { e.target.onerror = null; e.target.src='/default-avatar.png'; }} // Handle broken images
                 />
             </div>
          </div>
        </td>
        <td>{user.name}</td>
        <td>{formatDuration(user.testDuration)}</td>
        <td>
          {user.totalViolations > 0 ? (
            <span className="violations-count">{user.totalViolations}</span>
          ) : (
            'None'
          )}
        </td>
        <td>
          {user.violationDetails && user.violationDetails.length > 0 ? (
            <button onClick={() => setIsExpanded(!isExpanded)} className="details-button">
              {isExpanded ? 'Hide' : 'Show'} Details
            </button>
          ) : (
            <span>No Details</span>
          )}
        </td>
        <td>
          {user.screenshotFolderUrl ? (
             <a
                href={user.screenshotFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-button"
             >
                View Folder
             </a>
          ) : (
             <span>N/A</span>
          )}
        </td>
      </tr>

      {/* Expandable details row (remains the same) */}
      {isExpanded && user.violationDetails && user.violationDetails.length > 0 && (
        <tr className="details-row">
          <td colSpan="7">
            <div className="violation-details-container">
              <h4>Violation Details for {user.name}:</h4>
              <ul>
                {user.violationDetails.map((detail, index) => (
                  <li key={index} className="violation-detail-item">
                    <strong>Type:</strong> {detail.type || 'Unknown'}
                    <br />
                    <strong>Violation Duration:</strong> {formatDuration(detail.duration)}
                  </li>
                ))}
              </ul>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
export default UserRow;
