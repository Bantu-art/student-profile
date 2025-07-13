// Main application logic for Zone01 Kisumu Profile
class App {
  constructor() {
    this.init();
  }

  init() {
    this.updateAuthControls();
    this.setupEventListeners();
  }

  updateAuthControls() {
    const token = localStorage.getItem('jwt_token');
    const loginLink = document.getElementById('login-link');
    const profileLink = document.getElementById('profile-link');
    const logoutButton = document.getElementById('logout-button');

    if (token && this.isValidToken(token)) {
      // User is logged in
      if (loginLink) loginLink.style.display = 'none';
      if (profileLink) profileLink.style.display = 'inline-block';
      if (logoutButton) logoutButton.style.display = 'inline-block';
    } else {
      // User is not logged in
      if (loginLink) loginLink.style.display = 'inline-block';
      if (profileLink) profileLink.style.display = 'none';
      if (logoutButton) logoutButton.style.display = 'none';
    }
  }

  isValidToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (error) {
      return false;
    }
  }

  setupEventListeners() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => this.logout());
    }
  }

  logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    localStorage.removeItem('login_time');
    window.location.href = 'index.html';
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
