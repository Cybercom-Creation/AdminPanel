


import React, { useState, useEffect, useRef } from 'react'; 
import ExportButton from './ExportButton';
import DownloadButton from './DownloadButton'; // Import the new component
import UserTable from './components/UserTable';


import '../public/App.css';

function App() {
  // State to manage dropdown visibility
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Ref to detect clicks outside the menu
  const menuRef = useRef(null);

  // Function to toggle the menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Effect to handle clicks outside the menu to close it
  useEffect(() => {
    function handleClickOutside(event) {
      // Close if clicked outside the menu area (ref)
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    // Add event listener when the menu is open
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      // Clean up the event listener when the menu is closed or component unmounts
      document.removeEventListener('mousedown', handleClickOutside);
    }
    // Cleanup function to remove listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]); // Re-run effect when isMenuOpen changes

  return (
    <div className="app-container">
      {/* Header Section */}
      <header className="app-header">
        <h1 className="app-title">Admin Dashboard</h1>
      </header>
      {/* Action Buttons Container - now holds the dropdown trigger */}
      <div className="header-actions" ref={menuRef}> {/* Attach ref here */}
          {/* Button to trigger the dropdown */}
          <button onClick={toggleMenu} className="action-menu-trigger">
            <img src="/defaultAvtar.png" alt="Admin" className="admin-avatar-icon" />
            <span className="admin-text">Admin</span> {/* Text */}
            <span className="more-indicator">...</span> {/* More Indicator */}
          </button>

          {/* Conditionally render the dropdown menu */}
          {isMenuOpen && (
            <div className="action-menu-dropdown"> {/* New class for dropdown */}
              <ExportButton />
              <DownloadButton />
            </div>
          )}
        </div>

      {/* Main Content Area */}
      <main className="app-main-content">
        <UserTable />
      </main>
    </div>
  );
}

export default App;
