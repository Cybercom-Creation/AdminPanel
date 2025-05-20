
import React, { useState, useEffect, useMemo } from 'react';

import { fetchAdminUsers } from '../services/api';
import UserRow from './UserRow'; 
import './UserTable.css'; 

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

function UserTable({ setIsContentLoading, selectedCollegeId }) { 
    
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });

  // useEffect to fetch users based on selectedCollegeId
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      if (setIsContentLoading) {
        setIsContentLoading(true); 
      }
      setError(null);
      try {
        // Construct API URL with collegeId if selected
        let path = '/admin/users'; 
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
        console.error(err);
      } finally {
        setIsLoading(false);
        if (setIsContentLoading) {
          setIsContentLoading(false); 
        }
      }
    };
    loadUsers();
  }, [selectedCollegeId, setIsContentLoading]);

  useEffect(() => {
    
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

        
        if (key === 'testStartTime') {
          
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
              <th>User</th> 
              <th onClick={() => requestSort('name')}>
                Name{getSortIndicator('name')}
              </th>
              <th onClick={() => requestSort('testStartTime')}>
                Start Time{getSortIndicator('testStartTime')}
              </th>
              <th onClick={() => requestSort('testDuration')}>
                Duration{getSortIndicator('testDuration')}
              </th>
               <th onClick={() => requestSort('totalViolations')}> 
                Alerts{getSortIndicator('totalViolations')}
              </th>
              <th>Actions</th> 
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
