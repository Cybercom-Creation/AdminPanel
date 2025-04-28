// src/components/UserRow.jsx
import React, { useState } from 'react';
import { formatDuration, formatViolations } from '../services/api'; // Adjust path if needed
import './UserRow.css'; // We'll create this CSS file next

function UserRow({ user }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Main Data Row */}
      <tr className="user-row">
        <td>{user.id}</td>
        <td className="user-pic-cell">
          <div className="tooltip-container">
             <img
                src={user.smallPicUrl}
                alt={`${user.name}'s avatar`}
                className="user-avatar-small"
             />
             {/* Tooltip with larger image - shown on hover via CSS */}
             <div className="tooltip-content">
                 <img
                    src={user.largePicUrl}
                    alt={`${user.name}'s avatar (large)`}
                    className="user-avatar-large"
                 />
             </div>
          </div>
        </td>
        <td>{user.name}</td>
        <td>{formatDuration(user.testDuration)}</td>
        <td>{formatViolations(user.violations)} ({user.totalViolations} total)</td>
        <td>
          <button onClick={() => setIsExpanded(!isExpanded)} className="expand-button">
            {isExpanded ? 'Hide' : 'Show'} Details
          </button>
        </td>
        <td>
          {user.screenshotFolderUrl ? (
             <a
                href={user.screenshotFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-button" // Optional: Style as button
             >
                Open Folder
             </a>
          ) : (
             <span>N/A</span>
          )}
        </td>
      </tr>

      {/* Expanded Details Row (Conditionally Rendered) */}
      {isExpanded && (
        <tr className="details-row">
          <td colSpan="7"> {/* Make sure colSpan matches the number of columns */}
            <div className="details-panel">
              <h4>Violation Details for {user.name}</h4>
              {user.violationDetails && user.violationDetails.length > 0 ? (
                <ul>
                  {user.violationDetails.map((detail, index) => (
                    <li key={index}>
                      <strong>Type:</strong> {detail.type},{' '}
                      <strong>Timestamp:</strong> {new Date(detail.timestamp).toLocaleString()},{' '}
                      <strong>Info:</strong> {detail.details}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No detailed violation information available.</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default UserRow;
