import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Profile from './components/Profile';
import Loading from './components/Loading';
import './App.css';

// Main App Content Component
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while initializing authentication
  if (isLoading) {
    return <Loading message="Initializing application..." />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show profile page if authenticated
  return <Profile />;
};

// Main App Component with Authentication Provider
function App() {
  return (
    <AuthProvider>
      <div className="app">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
