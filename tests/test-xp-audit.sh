#!/bin/bash

# Get XP and Audit data for user 9052
TOKEN_FILE="${1:-jwt_token.txt}"
JWT_TOKEN=$(cat "$TOKEN_FILE" | tr -d '"')
GRAPHQL_URL="https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql"

echo "💰 Getting your XP and Audit data..."
echo ""

# Get XP transactions
echo "🏆 Your XP Transactions:"
curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"query": "{ transaction(where: {userId: {_eq: 9052}, type: {_eq: \"xp\"}}, limit: 20, order_by: {createdAt: desc}) { id type amount createdAt path object { name type } } }"}' | jq '.'

echo ""
echo "----------------------------------------"
echo ""

# Get audit votes (up/down)
echo "👥 Your Audit Votes:"
curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"query": "{ transaction(where: {userId: {_eq: 9052}, type: {_in: [\"up\", \"down\"]}}, limit: 20, order_by: {createdAt: desc}) { id type amount createdAt } }"}' | jq '.'

echo ""
echo "----------------------------------------"
echo ""

# Get all transaction types to see what's available
echo "📊 All your transaction types:"
curl -s -X POST "$GRAPHQL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"query": "{ transaction(where: {userId: {_eq: 9052}}, limit: 50, order_by: {createdAt: desc}) { id type amount createdAt } }"}' | jq '.data.transaction | group_by(.type) | map({type: .[0].type, count: length, total_amount: map(.amount) | add})'

echo ""
echo "🏁 XP and Audit data completed!"
