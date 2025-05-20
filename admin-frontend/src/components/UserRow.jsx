// src/components/UserRow.jsx
import React, { useState, useEffect } from 'react';
import { formatDuration, formatViolations } from '../services/api'; 
import './UserRow.css'; 

// Helper function to format the date/time 
const formatStartTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    return new Date(timestamp).toLocaleTimeString([], {hour: '2-digit',
      minute: '2-digit', 
      hour12: false });
  } catch (error) {
    console.error("Error formatting timestamp:", timestamp, error);
    return 'Invalid Date';
  }
};

function UserRow({ user }) {
  const [isExpanded, setIsExpanded] = useState(false);

  

  // State to manage image sources, allowing onError to permanently switch to fallback
  const [smallImgSrc, setSmallImgSrc] = useState(user.smallPicUrl || '/default-avatar.png');
  const [largeImgSrc, setLargeImgSrc] = useState(user.largePicUrl || '/default-avatar.png');

  // Update image sources if the user prop (and thus its pic URLs) changes
  useEffect(() => {
    setSmallImgSrc(user.smallPicUrl || '/defaultAvtar.png');
  }, [user.smallPicUrl]);

  useEffect(() => {
    setLargeImgSrc(user.largePicUrl || '/defaultAvtar.png');
  }, [user.largePicUrl]);

  const handleImageError = (setImageSrcCallback) => {
    // Set to default avatar path if the current src is not already the default
    
    setImageSrcCallback('/defaultAvtar.png');
  };

  // Basic check in case user prop is somehow invalid
  if (!user || !user.id) {
    console.warn("UserRow received invalid user prop:", user);
    return (
        <tr>
            <td colSpan="8">Invalid user data</td> {}
        </tr>
    );
  }

  const formatViolationType = (type) => {
    if (!type) return 'Unknown';
    switch (type.toLowerCase()) {
      case 'high_noise':
        return 'High Noise';
      case 'tab_switch':
        return 'App Switch';
      case 'no_face':
        return 'No Face';
      case 'multiple_face':
        return 'Multi Face';
      case 'screenshare_stop':
        return 'Screen Share Stop';
      case 'incorrect_screen_share':
        return 'Incorrect Screen Share';
      default:
        return type; 
    }
  };  
  // Determine if the folder icon should be visually enabled and if it's a link
  const hasDriveLink = !!user.driveFolderLink;
  const hasUserPhoto = !!user.smallPicUrl; // Check the original prop for an actual user photo
  const isFolderIconVisuallyEnabled = hasDriveLink || hasUserPhoto;

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
                src={smallImgSrc} // Use fallback
                alt={`${user.name}'s avatar`}
                className="user-avatar-small"
                
                onError={() => handleImageError(setSmallImgSrc)}
             />
             
             <div className="tooltip-content">
                 <img
                    src={largeImgSrc} // Use fallback
                    alt={`${user.name}'s avatar (large)`}
                    className="user-avatar-large"
                   
                    onError={() => handleImageError(setLargeImgSrc)}
                 />
             </div>
          </div>
        </td>
        <td>{user.name}</td>
        <td>{formatStartTime(user.testStartTime)}</td>
        <td>{formatDuration(user.testDuration)}</td>
        <td>
          {user.totalViolations > 0 ? (
            <span className="violations-count">{user.totalViolations}</span>
          ) : (
            '0'
          )}
        </td>
        <td>
          
          
          {hasDriveLink ? (
            <a
                href={user.driveFolderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="icon-link screenshot-icon-link" 
                title="View Drive Folder"
          >
                📁 {/* Folder Icon */}
          </a>
          ) : (
            <span className="icon-link screenshot-icon-disabled" title="No screenshots Available">📁 </span> // Disabled icon
          )}

          {user.violationDetails && user.violationDetails.length > 0 ? (
            <button onClick={() => setIsExpanded(!isExpanded)} className="details-button">
              {isExpanded ? '−' : '+'} {}
            </button>
          ) : (
            <span>{'\u00A0\u00A0\u00A0'}</span>
          )}
        </td>
        
      </tr>

      {isExpanded && user.violationDetails && user.violationDetails.length > 0 && (
        <tr className="details-row">
         
          <td colSpan="7">
            <div className="violation-details-container">
              <div className="details-header">
                <h4 className="violation-title">Alert Details</h4>
                <h4 className="violation-title">Test started at: {formatStartTime(user.testStartTime)}</h4>
              </div>
              
              <table className="violation-details-table">
                <thead>
                  <tr>
                    <th>Alert type</th>
                    <th>Time</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {user.violationDetails.map((detail, index) => (
                    // Use a unique key if available (like a detail ID), otherwise index is okay for static lists
                    <tr key={detail.id || index} className="violation-detail-item">
                       <td>{formatViolationType(detail.type)}</td>
                       <td>{formatStartTime(detail.startTime)}</td>
                       <td>{formatDuration(detail.duration)}</td>
                       
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
export default UserRow;
