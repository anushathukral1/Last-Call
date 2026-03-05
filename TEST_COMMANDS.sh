#!/bin/bash
# Quick test script for Render deployment
# Usage: bash TEST_COMMANDS.sh

RENDER_URL="https://last-call-kyd5.onrender.com"

echo "======================================"
echo "Testing Last Call Backend on Render"
echo "======================================"
echo ""

echo "1. Testing Root Endpoint (GET /)..."
curl -s $RENDER_URL/ | jq '.'
echo -e "\n"

echo "2. Testing Health Check (GET /health)..."
curl -s $RENDER_URL/health | jq '.'
echo -e "\n"

echo "3. Testing Telnyx Dynamic Variables..."
curl -s -X POST $RENDER_URL/telnyx/dynamic-variables \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "payload": {
        "telnyx_end_user_target": "+15551234567"
      }
    }
  }' | jq '.'
echo -e "\n"

echo "4. Testing getUserProfile..."
curl -s -X POST $RENDER_URL/telnyx/tools/getUserProfile \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+15551234567"}' | jq '.'
echo -e "\n"

echo "5. Testing createUser..."
curl -s -X POST $RENDER_URL/telnyx/tools/createUser \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+15559999999",
    "name": "Test User",
    "home_zip": "12345"
  }' | jq '.'
echo -e "\n"

echo "6. Testing getListings..."
curl -s -X POST $RENDER_URL/telnyx/tools/getListings \
  -H "Content-Type: application/json" \
  -d '{
    "zip_code": "12345",
    "dietary_restrictions": [],
    "allergies": [],
    "limit": 3
  }' | jq '.'
echo -e "\n"

echo "7. Testing MCP Tools endpoint..."
curl -s -X POST $RENDER_URL/mcp/tools \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "getUserProfile",
    "args": {"phone_number": "+15559999999"}
  }' | jq '.'
echo -e "\n"

echo "======================================"
echo "All tests completed!"
echo "======================================"
