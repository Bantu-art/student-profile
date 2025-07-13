#!/bin/bash

# Zone01 Kisumu API Authentication Test Script
# Usage: ./test-auth.sh <username_or_email> <password>

if [ $# -ne 2 ]; then
    echo "Usage: $0 <username_or_email> <password>"
    echo "Example: $0 myusername mypassword"
    echo "Example: $0 user@example.com mypassword"
    exit 1
fi

USERNAME="$1"
PASSWORD="$2"

echo "🔐 Testing Zone01 Kisumu Authentication..."
echo "Username/Email: $USERNAME"
echo "Password: [HIDDEN]"
echo ""

# Create base64 encoded credentials
CREDENTIALS=$(echo -n "$USERNAME:$PASSWORD" | base64)

echo "📡 Making authentication request..."
echo ""

# Test authentication
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
  "https://learn.zone01kisumu.ke/api/auth/signin" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $CREDENTIALS")

# Extract HTTP status and body
HTTP_STATUS=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
BODY=$(echo $RESPONSE | sed -e 's/HTTPSTATUS:.*//g')

echo "HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Authentication successful!"
    echo ""
    echo "JWT Token received:"
    echo "$BODY"
    echo ""
    
    # Save token to file for further testing
    echo "$BODY" > jwt_token.txt
    echo "💾 Token saved to jwt_token.txt"
    
    # Decode JWT payload (middle part)
    echo ""
    echo "🔍 JWT Token Analysis:"
    TOKEN_PAYLOAD=$(echo "$BODY" | cut -d'.' -f2)
    # Add padding if needed
    case $((${#TOKEN_PAYLOAD} % 4)) in
        2) TOKEN_PAYLOAD="${TOKEN_PAYLOAD}==" ;;
        3) TOKEN_PAYLOAD="${TOKEN_PAYLOAD}=" ;;
    esac
    
    echo "Decoded payload:"
    echo "$TOKEN_PAYLOAD" | base64 -d 2>/dev/null | jq . 2>/dev/null || echo "$TOKEN_PAYLOAD" | base64 -d 2>/dev/null
    
else
    echo "❌ Authentication failed!"
    echo "Response body: $BODY"
    
    case $HTTP_STATUS in
        401)
            echo ""
            echo "💡 Troubleshooting tips:"
            echo "- Check your username/email and password"
            echo "- Make sure your account is active"
            echo "- Try using email instead of username (or vice versa)"
            ;;
        403)
            echo ""
            echo "💡 Account may be suspended or restricted"
            ;;
        *)
            echo ""
            echo "💡 Unexpected error. Check network connection and try again."
            ;;
    esac
fi

echo ""
echo "🏁 Authentication test completed."
