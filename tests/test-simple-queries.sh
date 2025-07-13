#!/bin/bash

# Simple GraphQL queries that work
TOKEN_FILE="${1:-jwt_token.txt}"

if [ ! -f "$TOKEN_FILE" ]; then
    echo "❌ JWT token file not found: $TOKEN_FILE"
    exit 1
fi

JWT_TOKEN=$(cat "$TOKEN_FILE" | tr -d '"')
GRAPHQL_URL="https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql"

echo "📊 Testing Simple Profile Queries..."
echo ""

# Function to make GraphQL request
make_request() {
    local query="$1"
    local test_name="$2"
    
    echo "🔍 $test_name"
    echo "Query: $query"
    
    RESPONSE=$(curl -s -X POST \
        "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -d "{\"query\": \"$query\"}")
    
    echo "Response:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Test 1: Get your user info
make_request "{ user(where: {id: {_eq: 9052}}) { id login email firstName lastName createdAt } }" "Your User Info"

# Test 2: Get your XP transactions
make_request "{ transaction(where: {userId: {_eq: 9052}, type: {_eq: \"xp\"}}, limit: 10, order_by: {createdAt: desc}) { id type amount createdAt path object { name type } } }" "Your XP Transactions"

# Test 3: Get your audit votes
make_request "{ transaction(where: {userId: {_eq: 9052}, type: {_in: [\"up\", \"down\"]}}, limit: 10, order_by: {createdAt: desc}) { id type amount createdAt } }" "Your Audit Votes"

# Test 4: Get your progress
make_request "{ progress(where: {userId: {_eq: 9052}}, limit: 10, order_by: {createdAt: desc}) { id grade createdAt path object { name type } } }" "Your Progress"

# Test 5: Get your results
make_request "{ result(where: {userId: {_eq: 9052}}, limit: 10, order_by: {createdAt: desc}) { id grade createdAt path object { name type } } }" "Your Results"

echo "🏁 Simple queries completed!"
