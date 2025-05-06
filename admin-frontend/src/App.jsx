


import React, { useState, useEffect, useRef } from 'react'; 
import ExportButton from './ExportButton';
import DownloadButton from './DownloadButton'; // Import the new component
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

import { BrowserRouter as Router, Routes, Route, useNavigate, Outlet } from 'react-router-dom';
import UserTable from './components/UserTable';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import ForgotPasswordPage from './pages/ForgotPasswordPage'; // Import Forgot Password page
import ResetPasswordPage from './pages/ResetPasswordPage';   // Import Reset Password page

import '../public/App.css';

// Simple component to show a logout button when logged in
function AuthStatus() {
  let auth = useAuth();
  let navigate = useNavigate();

  // This component will now only provide the logout function to the dropdown
  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return { handleLogout, isAuthenticated: auth.isAuthenticated };
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
  const { handleLogout, isAuthenticated } = authStatus; // Destructure from the returned object

  const [isContentLoading, setIsContentLoading] = useState(false); // New state for content loading

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
      <h1 className="app-title">{!isContentLoading ? 'Admin' : ''}</h1>
        {/* The AuthStatus component is no longer directly rendered here for its text */}
      </header>
      {/* Action Buttons Container - now holds the dropdown trigger */}
      {/* Only show header actions if authenticated */}
      {isAuthenticated && (
      <div className="header-actions" ref={menuRef}> {/* Attach ref here */}
        {/* Button to trigger the dropdown */}
          <button onClick={toggleMenu} className="action-menu-trigger">
            <img src="/defaultAvtar.png" alt="Admin" className="admin-avatar-icon" />
            <span className="admin-text">Admin</span> {/* Text */}
          </button>

          {/* Conditionally render the dropdown menu */}
          {isMenuOpen && (
            <div className="action-menu-dropdown"> {/* New class for dropdown */}
              <ExportButton />
              <DownloadButton />
              <button onClick={handleLogout} className="dropdown-logout-button">
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}


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
          {/* Example of another protected route */}
          {/* <Route
            path="/settings"
            element={
              <PrivateRoute>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </PrivateRoute>
            }
          /> */}

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
