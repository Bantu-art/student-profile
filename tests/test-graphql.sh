#!/bin/bash

# Zone01 Kisumu GraphQL API Test Script
# Usage: ./test-graphql.sh [jwt_token_file]

TOKEN_FILE="${1:-jwt_token.txt}"

if [ ! -f "$TOKEN_FILE" ]; then
    echo "❌ JWT token file not found: $TOKEN_FILE"
    echo ""
    echo "Please run ./test-auth.sh first to get a JWT token, or specify token file:"
    echo "Usage: $0 [jwt_token_file]"
    exit 1
fi

JWT_TOKEN=$(cat "$TOKEN_FILE" | tr -d '"')

if [ -z "$JWT_TOKEN" ]; then
    echo "❌ JWT token is empty in file: $TOKEN_FILE"
    exit 1
fi

echo "🔧 Cleaned JWT token (removed quotes)"

echo "🧪 Testing Zone01 Kisumu GraphQL API..."
echo "Using token from: $TOKEN_FILE"
echo ""

# GraphQL endpoint
GRAPHQL_URL="https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql"

# Function to make GraphQL request
make_graphql_request() {
    local query="$1"
    local test_name="$2"
    
    echo "🔍 Testing: $test_name"
    echo "Query: $query"
    echo ""
    
    RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -d "{\"query\": \"$query\"}")
    
    HTTP_STATUS=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    BODY=$(echo $RESPONSE | sed -e 's/HTTPSTATUS:.*//g')
    
    echo "HTTP Status: $HTTP_STATUS"
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo "✅ Request successful"
        echo "Response:"
        echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    else
        echo "❌ Request failed"
        echo "Response: $BODY"
    fi
    
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Test 1: Simple user query
make_graphql_request "{ user { id login email } }" "Basic User Query"

# Test 2: User with limit
make_graphql_request "{ user(limit: 1) { id login email createdAt } }" "User Query with Limit"

# Test 3: Transaction query
make_graphql_request "{ transaction(limit: 5) { id type amount createdAt } }" "Transaction Query"

# Test 4: Progress query
make_graphql_request "{ progress(limit: 5) { id grade createdAt path } }" "Progress Query"

# Test 5: Result query
make_graphql_request "{ result(limit: 5) { id grade createdAt path } }" "Result Query"

# Test 6: Object query
make_graphql_request "{ object(limit: 5) { id name type } }" "Object Query"

echo "🏁 GraphQL API testing completed."
echo ""
echo "💡 Next steps:"
echo "1. If all tests passed, you can proceed with React implementation"
echo "2. If some tests failed, check the error messages for troubleshooting"
echo "3. Use the successful queries as reference for your React components"
