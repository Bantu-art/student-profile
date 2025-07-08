# GraphQL Profile Page

A modern React application that creates a personalized profile page using GraphQL queries to fetch user data from the Zone01 Kisumu platform.

## Features

- **Authentication System**: Secure login with username/email and password
- **Profile Dashboard**: Display user information, XP, grades, audits, and skills
- **Interactive Statistics**: SVG-based graphs showing progress and achievements
- **Responsive Design**: Modern UI/UX with responsive layout
- **Real-time Data**: Live GraphQL queries to fetch current user data

## Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Modern CSS with responsive design
- **Authentication**: JWT token-based authentication
- **Data Fetching**: GraphQL with custom client
- **Visualization**: Custom SVG graphs and charts
- **Deployment**: Ready for GitHub Pages, Netlify, or similar platforms

## GraphQL Endpoints

- **Authentication**: `https://learn.zone01kisumu.ke/api/auth/signin`
- **GraphQL API**: `https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql`

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
├── services/           # API and GraphQL services
├── utils/              # Utility functions
├── styles/             # CSS styles
└── assets/             # Static assets
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
