


import React, { useState, useEffect, useRef } from 'react'; 
import ExportButton from './ExportButton';
import DownloadButton from './DownloadButton'; 
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

import { BrowserRouter as Router, Routes, Route, useNavigate, Link, Navigate, useLocation  } from 'react-router-dom';
import UserTable from './components/UserTable';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import ForgotPasswordPage from './pages/ForgotPasswordPage'; 
import ResetPasswordPage from './pages/ResetPasswordPage';   
import SettingsControls from './components/SettingsControls';
import '../public/App.css';




const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';


function AuthStatus() {
  let auth = useAuth();
  let navigate = useNavigate();

  
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
  
  // AuthStatus itself uses useAuth and useNavigate internally.
  const authStatus = AuthStatus(); // Call AuthStatus to get its return value
  const { handleLogout, isAuthenticated, user } = authStatus;t
  console.log('User object in AppLayout:', user); 

  // State for settings navigation drawer
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const settingsDrawerRef = useRef(null);
  

  const [colleges, setColleges] = useState([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState(''); 
  const [isLoadingColleges, setIsLoadingColleges] = useState(false);

  const [isContentLoading, setIsContentLoading] = useState(false);

  

  const menuRef = useRef(null);

  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleSettingsDrawer = () => {
    setIsSettingsDrawerOpen(!isSettingsDrawerOpen);
  };

  // Effect to handle clicks outside the menu to close it
  useEffect(() => {
    function handleClickOutside(event) {
      
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
  }, [isMenuOpen]);

  // Effect to handle clicks outside the settings drawer to close it
  useEffect(() => {
    function handleClickOutsideSettings(event) {
      if (
        settingsDrawerRef.current &&
        !settingsDrawerRef.current.contains(event.target) &&
      
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

 
useEffect(() => {
  const fetchColleges = async () => {
    setIsLoadingColleges(true);
    try {
      console.log('Fetching colleges from /api/colleges...');
      const response = await fetch(`${API_BASE_URL}/api/colleges`);
      if (!response.ok) {
        console.error('Failed to fetch colleges, status:', response.status);
        throw new Error('Failed to fetch colleges');
      }
      const data = await response.json();
      console.log('Data received from /api/colleges:', JSON.stringify(data, null, 2)); 
      setColleges(data);
      console.log('Colleges state updated in App.jsx'); 
    } catch (error) {
      console.error('Error in fetchColleges:', error);
      setColleges([]);
    } finally {
      setIsLoadingColleges(false);
    }
  };

  if (isAuthenticated) {
    fetchColleges();
  }
}, [isAuthenticated]);


  const handleCollegeChange = (event) => {
    setSelectedCollegeId(event.target.value);
  };



  return (
    <div className="app-container">
      {/* Header Section */}
      <header className="app-header">
      <h1 className="app-title">{!isContentLoading ? 'Admin' : ''}</h1>
      {isAuthenticated && (
          <div className="header-controls">
            {/* College Filter Dropdown */}
            <div className="college-filter-container">
              <label htmlFor="college-select" className="college-filter-label">College:</label>
              <select
                id="college-select"
                value={selectedCollegeId}
                onChange={handleCollegeChange}
                disabled={isLoadingColleges}
                className="college-filter-select"
              >
                <option value="">All Colleges</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>{college.name}</option>
                ))}
              </select>
            </div>
            {/* User Avatar Dropdown */}
            <div className="header-actions" ref={menuRef}>
              <button onClick={toggleMenu} className="action-menu-trigger">
                <img src="/defaultAvtar.png" alt="Admin" className="admin-avatar-icon" />
              
               <span className="admin-text">{user?.username || 'User'}</span>
              </button>
              {isMenuOpen && (
                <div className="action-menu-dropdown">
                  {/* <ExportButton />
                  <DownloadButton /> */}
                  <ExportButton selectedCollegeId={selectedCollegeId} />
                  <DownloadButton selectedCollegeId={selectedCollegeId} />
                  <button onClick={toggleSettingsDrawer} className="dropdown-settings-button dropdown-link-button">
                    Settings
                  </button>
                  <button onClick={handleLogout} className="dropdown-logout-button">
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            
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
      
      {/* Main Content Area */}
      <main className="app-main-content">
        
         {React.cloneElement(children, { setIsContentLoading, selectedCollegeId })}
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
            <AppLayout>
              <div>Page Not Found</div>
            </AppLayout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
