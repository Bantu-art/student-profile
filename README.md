# Zone01 Kisumu GraphQL Profile Dashboard

A pure JavaScript application that creates a personalized profile page using GraphQL queries to fetch user data from the Zone01 Kisumu platform.

## Features

- **🔐 JWT Authentication**: Secure login with username/email and password
- **👤 Profile Dashboard**: Display user information, XP, grades, and project progress
- **📊 Interactive Statistics**: Custom SVG-based charts with hover effects and tooltips
- **📱 Responsive Design**: Modern UI/UX that works on all devices
- **⚡ Real-time Data**: Live GraphQL queries to Zone01 Kisumu API
- **🛠️ Debug Tools**: Comprehensive testing and debugging utilities
- **🔄 Error Handling**: Robust error handling with retry mechanisms
- **🎯 Performance**: Lightweight, no framework dependencies

## Technology Stack

- **Frontend**: Pure JavaScript (ES6+), HTML5, CSS3
- **Styling**: Modern CSS with animations and responsive design
- **Authentication**: JWT tokens with localStorage persistence
- **API**: GraphQL integration with Zone01 Kisumu endpoint
- **Charts**: Custom SVG-based interactive visualizations
- **Server**: Simple HTTP server (Python or Node.js)

## GraphQL Endpoints

- **Authentication**: `https://learn.zone01kisumu.ke/api/auth/signin`
- **GraphQL API**: `https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql`

## Installation & Usage

```bash
# Clone the repository
git clone <repository-url>
cd zone01-kisumu-graphql-profile

# Start the server (Python - recommended)
npm start
# or
python3 -m http.server 8000

# Alternative: Node.js server
npx http-server -p 8000
```

**Open your browser:** Navigate to `http://localhost:8000`

### 🔐 Login Process
1. Enter your Zone01 Kisumu credentials:
   - **Username**: `your_username` OR **Email**: `your_email@domain.com`
   - **Password**: `your_password`
2. Click "Sign In" to authenticate

### 📊 Features Available
- **Profile Dashboard**: Personal info, XP totals, project progress
- **Interactive Charts**: XP progression and project success rates
- **Real-time Data**: Live GraphQL queries to Zone01 Kisumu
- **Debug Tools**: Visit `/debug.html` for troubleshooting

## Project Structure

```
zone01-kisumu-graphql-profile/
├── index.html           # Login page
├── profile.html         # Main dashboard
├── debug.html          # Authentication debugging
├── css/
│   ├── auth.css        # Login page styles
│   └── profile.css     # Dashboard styles
├── js/
│   ├── auth.js         # Authentication logic
│   ├── api.js          # GraphQL API service
│   └── profile.js      # Dashboard functionality
├── tests/              # API testing scripts
│   ├── test-auth.sh    # Authentication testing
│   └── test-*.sh       # Various API tests
├── package.json        # Project configuration
└── README.md          # Documentation
```

## Authentication

The application supports login with:
- Username and password
- Email and password

JWT tokens are used for authenticated GraphQL requests.

## Statistics Graphs

The profile includes interactive SVG graphs showing:
- XP progression over time
- Project pass/fail ratios
- Audit statistics
- Skills development
- Piscine performance metrics

## Deployment

This application is configured for easy deployment to various hosting platforms including GitHub Pages, Netlify, Vercel, and others.
