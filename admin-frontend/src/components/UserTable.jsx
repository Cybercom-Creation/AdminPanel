// src/components/UserTable.jsx (or integrate into your page component)
import React, { useState, useEffect, useMemo } from 'react';
// We will fetch directly in this component as per guidance, so fetchAdminUsers might be bypassed for this specific filtering.
import { fetchAdminUsers } from '../services/api';
import UserRow from './UserRow'; // Path within the same components folder
import './UserTable.css'; // Path within the same components folder

const formatStartTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    return new Date(timestamp).toLocaleDateString();
  } catch (error) {
    console.error("Error formatting timestamp:", timestamp, error);
    return 'Invalid Date';
  }
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function UserTable({ setIsContentLoading, selectedCollegeId }) { // Accept selectedCollegeId
    
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });

  // useEffect to fetch users based on selectedCollegeId
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      if (setIsContentLoading) {
        setIsContentLoading(true); // Notify parent about loading state
      }
      setError(null);
      try {
        // Construct API URL with collegeId if selected
        let path = '/admin/users'; // Path for the users endpoint
        if (selectedCollegeId) {
          path += `?collegeId=${selectedCollegeId}`;
        }
        const response = await fetch(`${API_BASE_URL}${path}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
        const fetchedUsers = await response.json();
        setUsers(fetchedUsers);
      } catch (err) {
        setError('Failed to load user data.');
        console.error(err); // Log the actual error
      } finally {
        setIsLoading(false);
        if (setIsContentLoading) {
          setIsContentLoading(false); // Notify parent that loading is done
        }
      }
    };
    loadUsers();
  }, [selectedCollegeId, setIsContentLoading]); // Re-fetch when selectedCollegeId or setIsContentLoading changes

  useEffect(() => {
    // Pass the UserTable's loading state up to AppLayout
    if (setIsContentLoading) {
      setIsContentLoading(isLoading);
    }
  }, [isLoading, setIsContentLoading]);

  const sortedUsers = useMemo(() => {
    let sortableItems = [...users];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const key = sortConfig.key;
        let aValue = a[key];
        let bValue = b[key];

        // Specific handling for date/time sorting
        if (key === 'testStartTime') {
          // Convert to numbers (timestamps) for reliable comparison
          // Handle potential invalid dates by treating them as 0 or another default
          const dateA = aValue ? new Date(aValue).getTime() : 0;
          const dateB = bValue ? new Date(bValue).getTime() : 0;

          if (dateA < dateB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (dateA > dateB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }

        // Handle potential null/undefined or different types if necessary
        // Basic comparison for strings and numbers:
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [users, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
      if (!sortConfig || sortConfig.key !== key) return null;
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  }

  if (isLoading) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div className="user-table-container">
      <div className="user-table-header">
        <h2>User Management</h2>
        <h2>Date: {new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })}
        </h2>
      </div>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('id')}>
                ID{getSortIndicator('id')}
              </th>
              <th>User</th> {/* Not typically sortable */}
              <th onClick={() => requestSort('name')}>
                Name{getSortIndicator('name')}
              </th>
              <th onClick={() => requestSort('testStartTime')}>
                Start Time{getSortIndicator('testStartTime')}
              </th>
              <th onClick={() => requestSort('testDuration')}>
                Duration{getSortIndicator('testDuration')}
              </th>
               <th onClick={() => requestSort('totalViolations')}> {/* Sort by total count */}
                Alerts{getSortIndicator('totalViolations')}
              </th>
              <th>Actions</th> {/* Action column, not sortable */}
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map(user => (
              <UserRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserTable;
