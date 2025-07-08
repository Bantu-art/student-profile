import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="header-content">
          <div className="profile-title">
            <h1>Zone01 Kisumu Profile</h1>
            <p>Welcome to your GraphQL-powered profile dashboard</p>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Sign Out
          </button>
        </div>
      </header>

      <main className="profile-main">
        <div className="profile-content">
          {/* User Information Card */}
          <div className="info-card">
            <h2>User Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>User ID:</label>
                <span>{user?.sub || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Username:</label>
                <span>{user?.username || user?.login || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{user?.email || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Token Issued:</label>
                <span>{formatTimestamp(user?.iat)}</span>
              </div>
              <div className="info-item">
                <label>Token Expires:</label>
                <span>{formatTimestamp(user?.exp)}</span>
              </div>
            </div>
          </div>

          {/* JWT Token Information */}
          <div className="info-card">
            <h2>Authentication Details</h2>
            <div className="token-info">
              <p>
                <strong>Status:</strong> 
                <span className="status-badge authenticated">Authenticated</span>
              </p>
              <p>
                <strong>Token Type:</strong> JWT (JSON Web Token)
              </p>
              <p>
                <strong>API Endpoint:</strong> 
                <code>https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql</code>
              </p>
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="info-card coming-soon">
            <h2>Coming Soon</h2>
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <div>
                  <h3>XP Statistics</h3>
                  <p>Interactive graphs showing your XP progression over time</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <div>
                  <h3>Project Analytics</h3>
                  <p>Pass/fail ratios and project completion statistics</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔍</span>
                <div>
                  <h3>Audit Insights</h3>
                  <p>Detailed audit ratios and peer review analytics</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🏊‍♂️</span>
                <div>
                  <h3>Piscine Progress</h3>
                  <p>JavaScript and Go piscine statistics and achievements</p>
                </div>
              </div>
            </div>
          </div>

          {/* Debug Information (for development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="info-card debug-info">
              <h2>Debug Information</h2>
              <details>
                <summary>JWT Token Payload</summary>
                <pre>{JSON.stringify(user, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
