#!/bin/bash

# Zone01 Kisumu Profile Data Test Script
# This script tests the specific queries needed for the profile page

TOKEN_FILE="${1:-jwt_token.txt}"

if [ ! -f "$TOKEN_FILE" ]; then
    echo "❌ JWT token file not found: $TOKEN_FILE"
    echo "Please run ./test-auth.sh first to get a JWT token"
    exit 1
fi

JWT_TOKEN=$(cat "$TOKEN_FILE" | tr -d '"')
GRAPHQL_URL="https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql"

echo "📊 Testing Profile Data Queries..."
echo ""

# Function to make GraphQL request and save response
make_request() {
    local query="$1"
    local test_name="$2"
    local output_file="$3"
    
    echo "🔍 $test_name"
    
    RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -d "{\"query\": \"$query\"}")
    
    HTTP_STATUS=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    BODY=$(echo $RESPONSE | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo "✅ Success"
        echo "$BODY" > "$output_file"
        
        # Check if response has errors
        if echo "$BODY" | jq -e '.errors' > /dev/null 2>&1; then
            echo "⚠️  GraphQL errors found:"
            echo "$BODY" | jq '.errors'
        else
            echo "📄 Data saved to: $output_file"
            # Show data summary
            if echo "$BODY" | jq -e '.data' > /dev/null 2>&1; then
                echo "📈 Data summary:"
                echo "$BODY" | jq '.data | keys'
            fi
        fi
    else
        echo "❌ Failed (HTTP $HTTP_STATUS)"
        echo "$BODY"
    fi
    echo ""
}

# Create output directory
mkdir -p test_results

# Test 1: Get current user info
USER_QUERY='{ 
  user { 
    id 
    login 
    email 
    firstName 
    lastName 
    createdAt 
  } 
}'
make_request "$USER_QUERY" "User Information" "test_results/user.json"

# Test 2: Get user transactions (XP and audits)
TRANSACTION_QUERY='{ 
  transaction(limit: 20, order_by: {createdAt: desc}) { 
    id 
    type 
    amount 
    createdAt 
    path
    object {
      name
      type
    }
  } 
}'
make_request "$TRANSACTION_QUERY" "Transactions (XP & Audits)" "test_results/transactions.json"

# Test 3: Get user progress
PROGRESS_QUERY='{ 
  progress(limit: 20, order_by: {createdAt: desc}) { 
    id 
    grade 
    createdAt 
    path
    object {
      name
      type
    }
  } 
}'
make_request "$PROGRESS_QUERY" "Progress Data" "test_results/progress.json"

# Test 4: Get user results
RESULT_QUERY='{ 
  result(limit: 20, order_by: {createdAt: desc}) { 
    id 
    grade 
    createdAt 
    path
    object {
      name
      type
    }
  } 
}'
make_request "$RESULT_QUERY" "Results Data" "test_results/results.json"

# Test 5: Get objects (projects/exercises)
OBJECT_QUERY='{ 
  object(limit: 10) { 
    id 
    name 
    type 
    attrs
  } 
}'
make_request "$OBJECT_QUERY" "Objects (Projects/Exercises)" "test_results/objects.json"

echo "🏁 Profile data testing completed!"
echo ""
echo "📁 Results saved in test_results/ directory:"
echo "   - user.json: User information"
echo "   - transactions.json: XP and audit data"
echo "   - progress.json: Exercise progress"
echo "   - results.json: Project results"
echo "   - objects.json: Available projects/exercises"
echo ""
echo "💡 Next steps:"
echo "1. Review the JSON files to understand the data structure"
echo "2. Use this data structure to build your React components"
echo "3. Test with your actual user ID in filtered queries"
