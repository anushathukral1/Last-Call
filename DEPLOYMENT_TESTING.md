# Render Deployment Testing Guide

## Deployment URL
https://last-call-kyd5.onrender.com

## Summary of Routes

Your Express server has the following endpoints configured:

### 1. Root Endpoint
- **GET /** - Returns server status and available endpoints

### 2. Health Check
- **GET /health** - Health check endpoint

### 3. Telnyx Dynamic Variables Webhook
- **POST /telnyx/dynamic-variables** - Handles Telnyx call initialization
  - Returns user data in Telnyx format: `{"dynamic_variables": {...}}`

### 4. Telnyx Tool Endpoints (Individual Routes)
- **POST /telnyx/tools/getUserProfile** - Get user profile by phone number
- **POST /telnyx/tools/createUser** - Create a new user
- **POST /telnyx/tools/getListings** - Get restaurant listings by ZIP code
- **POST /telnyx/tools/createReservation** - Create a reservation

### 5. MCP Tools Endpoint (Generic)
- **POST /mcp/tools** - Generic tool endpoint for MCP integration
  - Accepts: `{"tool": "toolName", "args": {...}}`

---

## 🧪 Test Commands for Render Deployment

After deploying to Render, run these curl commands to verify all endpoints:

### 1. Test Root Endpoint
```bash
curl https://last-call-kyd5.onrender.com/
```
**Expected Response:**
```json
{
  "message": "Last Call backend running",
  "status": "ok",
  "endpoints": {
    "health": "GET /health",
    "dynamicVariables": "POST /telnyx/dynamic-variables",
    "telnyxTools": "POST /telnyx/tools/{getUserProfile,createUser,getListings,createReservation}",
    "mcpTools": "POST /mcp/tools"
  }
}
```

### 2. Test Health Check
```bash
curl https://last-call-kyd5.onrender.com/health
```
**Expected Response:**
```json
{"ok": true}
```

### 3. Test Telnyx Dynamic Variables Webhook
```bash
curl -X POST https://last-call-kyd5.onrender.com/telnyx/dynamic-variables \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "payload": {
        "telnyx_end_user_target": "+15551234567"
      }
    }
  }'
```
**Expected Response (new user):**
```json
{
  "dynamic_variables": {
    "caller_phone": "+15551234567",
    "is_new_user": true
  }
}
```

**Expected Response (existing user):**
```json
{
  "dynamic_variables": {
    "caller_phone": "+15551234567",
    "is_new_user": false,
    "user_id": "uuid-here",
    "user_name": "John Doe",
    "home_zip": "12345"
  }
}
```

### 4. Test Telnyx Tool: getUserProfile
```bash
curl -X POST https://last-call-kyd5.onrender.com/telnyx/tools/getUserProfile \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+15551234567"
  }'
```
**Expected Response (user exists):**
```json
{
  "user_id": "uuid",
  "name": "Test User",
  "home_zip": "12345",
  "dietary_restrictions": [],
  "allergies": []
}
```
**Expected Response (user not found):**
```json
null
```

### 5. Test Telnyx Tool: createUser
```bash
curl -X POST https://last-call-kyd5.onrender.com/telnyx/tools/createUser \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+15559876543",
    "name": "Jane Smith",
    "home_zip": "90210",
    "dietary_restrictions": ["vegetarian"],
    "allergies": ["peanuts"]
  }'
```
**Expected Response:**
```json
{
  "user_id": "uuid",
  "name": "Jane Smith",
  "home_zip": "90210",
  "dietary_restrictions": ["vegetarian"],
  "allergies": ["peanuts"],
  "success": true
}
```

### 6. Test Telnyx Tool: getListings
```bash
curl -X POST https://last-call-kyd5.onrender.com/telnyx/tools/getListings \
  -H "Content-Type: application/json" \
  -d '{
    "zip_code": "12345",
    "dietary_restrictions": [],
    "allergies": [],
    "limit": 3
  }'
```
**Expected Response:**
```json
{
  "listings": [
    {
      "listing_id": "uuid",
      "restaurant_name": "Restaurant Name",
      "restaurant_address": "123 Main St",
      "item_name": "Pizza Slice",
      "description": "Delicious cheese pizza",
      "original_price": 5.99,
      "discounted_price": 2.99,
      "quantity_available": 5,
      "pickup_deadline": "2026-03-05T22:00:00Z",
      "dietary_tags": ["vegetarian"]
    }
  ],
  "count": 1
}
```

### 7. Test Telnyx Tool: createReservation
```bash
curl -X POST https://last-call-kyd5.onrender.com/telnyx/tools/createReservation \
  -H "Content-Type: application/json" \
  -d '{
    "listing_id": "your-listing-uuid",
    "user_id": "your-user-uuid",
    "quantity": 1
  }'
```
**Expected Response (success):**
```json
{
  "success": true,
  "reservation_id": "uuid",
  "pickup_code": "ABC123",
  "restaurant_name": "Restaurant Name",
  "restaurant_address": "123 Main St",
  "item_name": "Pizza Slice",
  "quantity": 1,
  "total_price": 2.99,
  "pickup_deadline": "2026-03-05T22:00:00Z",
  "quantity_remaining": 4
}
```

### 8. Test MCP Tools Endpoint (Generic Interface)
```bash
curl -X POST https://last-call-kyd5.onrender.com/mcp/tools \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "getUserProfile",
    "args": {
      "phone_number": "+15551234567"
    }
  }'
```
**Expected Response:** Same as individual tool endpoints above.

---

## 🔍 Route Clarification

**Important:** The task mentioned routes like `/src/routes/dynamicVariables` and `/src/tools`, but these are **file paths**, not URL routes. The actual HTTP endpoints are:

| Mentioned in Task | Actual HTTP Route |
|-------------------|-------------------|
| `/src/routes/dynamicVariables` | `/telnyx/dynamic-variables` |
| `/src/tools` | `/telnyx/tools/*` and `/mcp/tools` |

---

## ✅ Verification Checklist

- [x] Server listens on `process.env.PORT`
- [x] Root route (`GET /`) returns JSON response
- [x] Health check endpoint works
- [x] Dynamic variables webhook returns correct Telnyx format: `{"dynamic_variables": {...}}`
- [x] All 4 Telnyx tool endpoints are accessible:
  - [x] `/telnyx/tools/getUserProfile`
  - [x] `/telnyx/tools/createUser`
  - [x] `/telnyx/tools/getListings`
  - [x] `/telnyx/tools/createReservation`
- [x] MCP router works correctly for local development
- [x] All routers are mounted correctly in `src/index.ts`

---

## 🚀 Deployment Steps

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Ensure Render settings:**
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment Variables: Set `PORT` (Render provides this automatically)
   - Add your Supabase credentials to Render environment variables

3. **Push to Git and trigger deployment:**
   ```bash
   git add .
   git commit -m "Fix Express routes for Render deployment"
   git push origin main
   ```

4. **Wait for Render to deploy** (usually 2-5 minutes)

5. **Test all endpoints** using the curl commands above

---

## 🐛 Troubleshooting

### If `GET /` returns "Cannot GET /"
- **Cause:** Root route defined after other routers
- **Fix:** Already fixed! Root route is now defined before other routers

### If `/telnyx/dynamic-variables` returns 404
- **Cause:** Router not mounted or wrong path
- **Fix:** Verified - route is correctly defined and mounted

### If tools return 500 errors
- **Cause:** Missing Supabase environment variables
- **Fix:** Ensure these are set in Render:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`

### If MCP tools fail
- **Cause:** Database connection or validation errors
- **Fix:** Check Render logs for detailed error messages

---

## 📝 Notes

- The MCP router logic remains unchanged as requested
- All routes have been tested locally and work correctly
- The server correctly uses `process.env.PORT` for Render compatibility
- Error handling is in place for all tool endpoints
- The dynamic variables endpoint always returns 200 to prevent Telnyx call failures
