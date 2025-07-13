// Zone01 Kisumu Authentication
class Auth {
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

        // Bind login button click
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => this.handleLogin(e));
        }

        // Bind form submission as backup
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Add enter key support
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const usernameField = document.getElementById('username');
                const passwordField = document.getElementById('password');
                if (document.activeElement === usernameField || document.activeElement === passwordField) {
                    this.handleLogin(e);
                }
            }
        });


    }

    async handleLogin(event) {
        if (event) {
            event.preventDefault();
        }

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            this.showError('Please enter both username/email and password');
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

                // Small delay to ensure storage is complete
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 100);
            } else {
                this.showError('Authentication failed - no token received');
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
            // Create base64 encoded credentials
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

                // Remove quotes if present
                const cleanToken = token.replace(/"/g, '');

                // Validate token format (basic JWT check)
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

        // Check if token is expired (basic check)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            return payload.exp > now;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    setLoading(loading) {
        const btn = document.getElementById('loginBtn');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');
        
        if (loading) {
            btn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline';
        } else {
            btn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.style.display = 'none';
    }

    getErrorMessage(error) {
        if (error.message.includes('401')) {
            return 'Invalid username/email or password. Please try again.';
        } else if (error.message.includes('403')) {
            return 'Account access restricted. Please contact support.';
        } else if (error.message.includes('Network')) {
            return 'Network error. Please check your connection and try again.';
        } else {
            return 'Login failed. Please try again or contact support.';
        }
    }

    // Utility method for other pages
    static getToken() {
        return localStorage.getItem('jwt_token');
    }

    static getUsername() {
        return localStorage.getItem('username');
    }

    static logout() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('username');
        localStorage.removeItem('login_time');
        window.location.href = 'index.html';
    }

    static requireAuth() {
        const token = Auth.getToken();
        if (!token) {
            window.location.href = 'index.html';
            return false;
        }

        // Check token expiration
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp <= now) {
                Auth.logout();
                return false;
            }
            return true;
        } catch (error) {
            Auth.logout();
            return false;
        }
    }
}

// Initialize authentication when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Auth();
});
