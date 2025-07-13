# Zone01 Kisumu API Testing Guide

This guide will help you test the Zone01 Kisumu APIs from the terminal before implementing the React components.

## Prerequisites

- `curl` (for making HTTP requests)
- `jq` (for JSON parsing) - already installed ✅
- Your Zone01 Kisumu credentials (username/email and password)

## Step-by-Step Testing Process

### Step 1: Test Authentication

First, test the authentication endpoint to get a JWT token:

```bash
./test-auth.sh your_username your_password
```

Or with email:
```bash
./test-auth.sh your_email@example.com your_password
```

**Expected Output:**
- ✅ Authentication successful message
- JWT token displayed and saved to `jwt_token.txt`
- Decoded JWT payload showing user information

**If it fails:**
- Check your credentials
- Try using email instead of username (or vice versa)
- Ensure your account is active

### Step 2: Test Basic GraphQL Queries

Once you have a valid JWT token, test the GraphQL endpoint:

```bash
./test-graphql.sh
```

This will test:
- Basic user query
- Transaction queries (XP data)
- Progress queries (exercise data)
- Result queries (project data)
- Object queries (available projects/exercises)

**Expected Output:**
- ✅ Success messages for each query
- JSON responses showing your data structure

### Step 3: Test Profile-Specific Data

Run the comprehensive profile data test:

```bash
./test-profile-data.sh
```

This will:
- Fetch all data needed for your profile page
- Save responses to `test_results/` directory
- Show data summaries

**Expected Output:**
- Multiple JSON files in `test_results/` directory
- Data summaries showing available information

## Understanding the Data Structure

After running the tests, examine the JSON files:

```bash
# View user information
cat test_results/user.json | jq '.'

# View XP transactions
cat test_results/transactions.json | jq '.data.transaction[] | select(.type == "xp")'

# View audit data
cat test_results/transactions.json | jq '.data.transaction[] | select(.type == "up" or .type == "down")'

# View project results
cat test_results/results.json | jq '.data.result[] | select(.object.type == "project")'

# View exercise progress
cat test_results/progress.json | jq '.data.progress[]'
```

## Common Issues and Solutions

### 1. Authentication Fails (401)
- Double-check your username/email and password
- Try the alternative login method (email vs username)
- Ensure your account is not suspended

### 2. GraphQL Errors
- Check if your JWT token is valid: `cat jwt_token.txt`
- Token might have expired - re-run authentication
- Some queries might require specific permissions

### 3. Empty Data Responses
- Your account might not have much activity yet
- Try different query limits or filters
- Check if you're querying the right data types

## Next Steps

Once all tests pass:

1. **Analyze the data structure** - Look at the JSON responses to understand what data is available
2. **Plan your React components** - Based on the available data, plan your profile page structure
3. **Implement authentication** - Use the working authentication flow in your React app
4. **Build GraphQL queries** - Use the tested queries as templates for your React components
5. **Create the UI** - Build your profile page with the confirmed data structure

## Data Available for Profile Page

Based on successful tests, you should have access to:

- **User Info**: id, login, email, firstName, lastName, createdAt
- **XP Data**: Transaction history with amounts and dates
- **Project Results**: Pass/fail status, grades, completion dates
- **Exercise Progress**: Individual exercise completion and grades
- **Audit Data**: Up/down votes from peer reviews
- **Skills Data**: Derived from exercise paths and completion status

## Files Created

- `test-auth.sh` - Authentication testing script
- `test-graphql.sh` - Basic GraphQL query testing
- `test-profile-data.sh` - Comprehensive profile data testing
- `jwt_token.txt` - Your JWT token (keep secure!)
- `test_results/` - Directory with JSON response files

## Security Note

⚠️ **Important**: The `jwt_token.txt` file contains your authentication token. Keep it secure and don't commit it to version control.

## Ready to Code?

Once all tests pass and you understand the data structure, you're ready to implement the React components with confidence that the API integration will work!
