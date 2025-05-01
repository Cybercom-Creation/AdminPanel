// src/components/UserTable.jsx (or integrate into your page component)
import React, { useState, useEffect, useMemo } from 'react';
// Correct path assuming api.js is now in admin-frontend/src/services/
import { fetchAdminUsers } from '../services/api';
import UserRow from './UserRow'; // Path within the same components folder
import './UserTable.css'; // Path within the same components folder

function UserTable() {
    
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

  const sortedUsers = useMemo(() => {
    let sortableItems = [...users];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

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
    return <div>Loading user data...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div className="user-table-container">
      <h2>User Management</h2>
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
              <th>Start Time</th> 
              <th>End Time</th>   
              <th onClick={() => requestSort('testDuration')}>
                Duration{getSortIndicator('testDuration')}
              </th>
               <th onClick={() => requestSort('totalViolations')}> {/* Sort by total count */}
                Violations{getSortIndicator('totalViolations')}
              </th>
              <th>Screenshots</th> {/* Action column, not sortable */}
              <th>Details</th> {/* Action column, not sortable */}
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
