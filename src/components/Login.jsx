import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const { login, isLoading, error, clearError } = useAuth();

  // Clear errors when component mounts or form data changes
  useEffect(() => {
    if (error) {
      clearError();
    }
    setValidationErrors({});
  }, [formData.identifier, formData.password]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};

    if (!formData.identifier.trim()) {
      errors.identifier = 'Username or email is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 3) {
      errors.password = 'Password must be at least 3 characters long';
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Clear validation errors
    setValidationErrors({});

    // Attempt login
    const result = await login(formData.identifier.trim(), formData.password);
    
    if (!result.success) {
      // Error is handled by the AuthContext
      console.error('Login failed:', result.error);
    }
  };

  // Determine if identifier is email or username
  const getIdentifierType = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(formData.identifier) ? 'email' : 'username';
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Zone01 Kisumu</h1>
          <h2>GraphQL Profile</h2>
          <p>Sign in to access your profile and statistics</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Global error message */}
          {error && (
            <div className="error-message global-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Identifier field (username or email) */}
          <div className="form-group">
            <label htmlFor="identifier">
              Username or Email
              {formData.identifier && (
                <span className="identifier-type">
                  ({getIdentifierType()})
                </span>
              )}
            </label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleInputChange}
              placeholder="Enter your username or email"
              className={validationErrors.identifier ? 'error' : ''}
              disabled={isLoading}
              autoComplete="username"
            />
            {validationErrors.identifier && (
              <div className="error-message">
                {validationErrors.identifier}
              </div>
            )}
          </div>

          {/* Password field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className={validationErrors.password ? 'error' : ''}
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {validationErrors.password && (
              <div className="error-message">
                {validationErrors.password}
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading || !formData.identifier || !formData.password}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            This application connects to the Zone01 Kisumu GraphQL API to fetch your profile data and statistics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
