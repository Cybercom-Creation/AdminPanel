


import React, { useState, useEffect, useRef } from 'react'; 
import ExportButton from './ExportButton';
import DownloadButton from './DownloadButton'; // Import the new component
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

import { BrowserRouter as Router, Routes, Route, useNavigate, Link, Navigate, useLocation  } from 'react-router-dom';
import UserTable from './components/UserTable';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import ForgotPasswordPage from './pages/ForgotPasswordPage'; // Import Forgot Password page
import ResetPasswordPage from './pages/ResetPasswordPage';   // Import Reset Password page
import SettingsControls from './components/SettingsControls'; // Import the new settings controls component
import '../public/App.css';


// function ProtectedRoute({ children }) {
//   const { isAuthenticated } = useAuth();
//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }
//   return children;
// }



// Simple component to show a logout button when logged in
function AuthStatus() {
  let auth = useAuth();
  let navigate = useNavigate();

  // This component will now only provide the logout function to the dropdown
  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return { handleLogout, isAuthenticated: auth.isAuthenticated, user: auth.user };
}



  // AppLayout now receives children, which will be the protected page content
  function AppLayout({ children }) {
  // State to manage dropdown visibility
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Ref to detect clicks outside the menu
  // Get logout function and authentication status
  //const { handleLogout, isAuthenticated } = useAuth(); // Changed to use useAuth directly here
   // We need to call AuthStatus to get its returned object which includes handleLogout
  // AuthStatus itself uses useAuth and useNavigate internally.
  const authStatus = AuthStatus(); // Call AuthStatus to get its return value
  const { handleLogout, isAuthenticated, user } = authStatus; // Destructure from the returned object
  console.log('User object in AppLayout:', user); // <-- Add this line

  // State for settings navigation drawer
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const settingsDrawerRef = useRef(null);
  //const settingsIconRef = useRef(null);

  const [isContentLoading, setIsContentLoading] = useState(false); // New state for content loading

  

  const menuRef = useRef(null);

  // Function to toggle the menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleSettingsDrawer = () => {
    setIsSettingsDrawerOpen(!isSettingsDrawerOpen);
  };

  // Effect to handle clicks outside the menu to close it
  useEffect(() => {
    function handleClickOutside(event) {
      // Close if clicked outside the menu area (ref)
      if (menuRef.current && !menuRef.current.contains(event.target) && !event.target.closest('.action-menu-trigger')) {
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

  // Effect to handle clicks outside the settings drawer to close it
  useEffect(() => {
    function handleClickOutsideSettings(event) {
      if (
        settingsDrawerRef.current &&
        !settingsDrawerRef.current.contains(event.target) &&
      //   settingsIconRef.current && 
      //   !settingsIconRef.current.contains(event.target)
      // ) {
      // Check if the click was outside the action menu trigger as well, if settings is opened from there
      !event.target.closest('.action-menu-trigger') && !event.target.closest('.action-menu-dropdown .dropdown-settings-button')
    ) {
        setIsSettingsDrawerOpen(false);
      }
    }
    if (isSettingsDrawerOpen) {
      document.addEventListener('mousedown', handleClickOutsideSettings);
    } else {
      document.removeEventListener('mousedown', handleClickOutsideSettings);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideSettings);
    };
  }, [isSettingsDrawerOpen]);


  return (
    <div className="app-container">
      {/* Header Section */}
      <header className="app-header">
      <h1 className="app-title">{!isContentLoading ? 'Admin' : ''}</h1>
      {isAuthenticated && (
          <div className="header-controls">
            {/* User Avatar Dropdown */}
            <div className="header-actions" ref={menuRef}>
              <button onClick={toggleMenu} className="action-menu-trigger">
                <img src="/defaultAvtar.png" alt="Admin" className="admin-avatar-icon" />
               {/* Display user's name, fallback to 'User' or email if name is not present */}
               <span className="admin-text">{user?.username || 'User'}</span>
              </button>
              {isMenuOpen && (
                <div className="action-menu-dropdown">
                  <ExportButton />
                  <DownloadButton />
                  <button onClick={toggleSettingsDrawer} className="dropdown-settings-button dropdown-link-button">
                    Settings
                  </button>
                  <button onClick={handleLogout} className="dropdown-logout-button">
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            
            {/* <div className="settings-control" ref={settingsIconRef}>
              <button onClick={toggleSettingsDrawer} className="settings-icon-button" aria-label="Open Settings">
                
                <span role="img" aria-label="settings">⚙️</span>
              </button>
            </div> */}
          </div>
        )}
      </header>

      {/* Settings Drawer */}
      {isAuthenticated && (
        <div className={`settings-drawer ${isSettingsDrawerOpen ? 'open' : ''}`} ref={settingsDrawerRef}>
          <nav>
          <SettingsControls />
          </nav>
        </div>
       )}
      {/* Action Buttons Container - now holds the dropdown trigger */}
      {/* Only show header actions if authenticated */}
      {/* {isAuthenticated && (
      <div className="header-actions" ref={menuRef}> 
        
          <button onClick={toggleMenu} className="action-menu-trigger">
            <img src="/defaultAvtar.png" alt="Admin" className="admin-avatar-icon" />
            <span className="admin-text">Admin</span> 
          </button>

          
          {isMenuOpen && (
            <div className="action-menu-dropdown"> 
              <ExportButton />
              <Link to="/settings" className="dropdown-link-button"> 
                Settings
              </Link>
              <DownloadButton />
              <button onClick={handleLogout} className="dropdown-logout-button">
                Sign Out
              </button>
            </div>
          )}
        </div>
      )} */}


      {/* Main Content Area */}
      {/* Main Content Area */}
      <main className="app-main-content">
        {React.cloneElement(children, { setIsContentLoading })}
      </main>
    </div>
  );
}

// Main App component wraps everything with Providers and Router
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Protected Routes - these will render inside AppLayout */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppLayout>
                  <UserTable />
                </AppLayout>
              </PrivateRoute>
            }
          />
         
          

          {/* Catch-all or Not Found Route */}
          <Route path="*" element={
            <AppLayout> {/* Optionally wrap not found in layout too, or have a simpler one */}
              <div>Page Not Found</div>
            </AppLayout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
