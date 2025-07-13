// Zone01 Kisumu Login Logic
class LoginManager {
  constructor() {
    this.apiUrl = 'https://learn.zone01kisumu.ke/api/auth/signin';
    this.init();
  }

  init() {
    // Check if already logged in
    if (this.isLoggedIn()) {
      window.location.href = 'profile.html';
      return;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleLogin(e));
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => this.logout());
    }
  }

  async handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');
    
    if (!username || !password) {
      this.showError('Please enter both username and password');
      return;
    }

    this.setLoading(true);
    this.hideError();

    try {
      const token = await this.authenticate(username, password);
      
      if (token) {
        // Save token and user info
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('username', username);
        localStorage.setItem('login_time', new Date().toISOString());
        
        // Redirect to profile
        window.location.href = 'profile.html';
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError(this.getErrorMessage(error));
    } finally {
      this.setLoading(false);
    }
  }

  async authenticate(username, password) {
    try {
      const credentials = btoa(`${username}:${password}`);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        }
      });

      if (response.ok) {
        const token = await response.text();
        const cleanToken = token.replace(/"/g, '');
        
        // Validate token format
        if (cleanToken.split('.').length === 3) {
          return cleanToken;
        } else {
          throw new Error('Invalid token format received');
        }
      } else {
        const errorText = await response.text();
        throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your internet connection');
      }
      throw error;
    }
  }

  isLoggedIn() {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (error) {
      return false;
    }
  }

  setLoading(loading) {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? 'Logging in...' : 'Login';
    }
  }

  showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  hideError() {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  getErrorMessage(error) {
    if (error.message.includes('401')) {
      return 'Invalid username or password. Please try again.';
    } else if (error.message.includes('403')) {
      return 'Account access restricted. Please contact support.';
    } else if (error.message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    } else {
      return 'Login failed. Please try again or contact support.';
    }
  }

  logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    localStorage.removeItem('login_time');
    window.location.href = '../index.html';
  }

  // Static methods for use in other modules
  static getToken() {
    return localStorage.getItem('jwt_token');
  }

  static getUsername() {
    return localStorage.getItem('username');
  }

  static requireAuth() {
    const token = LoginManager.getToken();
    if (!token) {
      window.location.href = '../pages/login.html';
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp <= now) {
        localStorage.removeItem('jwt_token');
        window.location.href = '../pages/login.html';
        return false;
      }
      return true;
    } catch (error) {
      localStorage.removeItem('jwt_token');
      window.location.href = '../pages/login.html';
      return false;
    }
  }
}

// Initialize login manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LoginManager();
});
