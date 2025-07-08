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
            <h2>👤 User Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>User ID:</label>
                <span>{user?.sub || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Username:</label>
                <span>{user?.login || 'N/A'}</span>
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

          {/* Coming Soon Section */}
          <div className="info-card coming-soon">
            <h2>📊 Profile Data Coming Soon</h2>
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">🏆</span>
                <div>
                  <h3>XP Statistics</h3>
                  <p>Your total XP and progression over time</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📈</span>
                <div>
                  <h3>Project Performance</h3>
                  <p>Pass/fail ratios and project completion statistics</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <div>
                  <h3>Skills Progress</h3>
                  <p>Your skills development and exercise completion</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔍</span>
                <div>
                  <h3>Audit Performance</h3>
                  <p>Audit ratios and peer review statistics</p>
                </div>
              </div>
            </div>
            <div className="coming-soon-note">
              <p>
                <strong>Note:</strong> GraphQL data fetching will be implemented in the next phase.
                Currently showing basic authentication information.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
