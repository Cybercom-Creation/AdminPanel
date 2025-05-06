// src/components/UserTable.jsx (or integrate into your page component)
import React, { useState, useEffect, useMemo } from 'react';
// Correct path assuming api.js is now in admin-frontend/src/services/
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

function UserTable({ setIsContentLoading }) {
    
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedUsers = await fetchAdminUsers();
        setUsers(fetchedUsers);
      } catch (err) {
        setError('Failed to load user data.');
        console.error(err); // Log the actual error
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []); // Empty dependency array means this runs once on mount

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
        <h2>Date: {'02/05/2025'}</h2>
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
