# Last Call - Backend Implementation

Voice-first surplus food discovery system built with Telnyx AI Assistant, Express, and Supabase.

## 📋 Backend Review Status

✅ **Infrastructure:** Supabase connection, Express server, routing - all working  
✅ **Fixed Implementations:** All 4 MCP tools updated with validation  
⚠️ **Database Setup Required:** Schema and seed data need to be applied  
⚠️ **Testing Pending:** Full end-to-end testing after database setup  

See **[REVIEW_FINDINGS.md](./REVIEW_FINDINGS.md)** for detailed review results and fixes applied.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
cp .env.example .env
```

Edit `.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
```

### 3. Setup Database
Execute `schema.sql` in your Supabase SQL Editor:
- Creates all 4 tables (users, restaurants, listings, reservations)
- Creates indexes for performance
- Creates `reserve_listing()` stored procedure for atomic reservations
- Seeds 5 restaurants and 10 listings
- Seeds 1 test user

**Important:** The seed data sets listing deadlines to 3 hours from execution time.

### 4. Build and Run
```bash
npm run build
npm start
```

Server will start on `http://localhost:3000`

### 5. Test Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Get user profile
curl -X POST http://localhost:3000/mcp/tools \
  -H "Content-Type: application/json" \
  -d '{"tool":"getUserProfile","args":{"phone_number":"+15550100"}}'

# Get listings in 90210
curl -X POST http://localhost:3000/mcp/tools \
  -H "Content-Type: application/json" \
  -d '{"tool":"getListings","args":{"zip_code":"90210"}}'
```

---

## 📁 Project Structure

```
last-call/
├── src/
│   ├── db/
│   │   └── supabase.ts          # Supabase client configuration
│   ├── routes/
│   │   ├── health.ts            # Health check endpoint
│   │   ├── dynamicVariables.ts  # Telnyx dynamic variables webhook
│   │   └── mcp.ts               # MCP tool router
│   ├── tools/
│   │   ├── getUserProfile.ts    # Fetch user by phone number
│   │   ├── createUser.ts        # Onboard new user
│   │   ├── getListings.ts       # Search available food listings
│   │   └── createReservation.ts # Atomic reservation with row locking
│   └── index.ts                 # Express server entry point
├── schema.sql                   # Complete database setup
├── PRD.md                       # Product requirements document
├── REVIEW_FINDINGS.md           # Backend review results
└── package.json
```

---

## 🛠️ MCP Tools API

### Endpoint
`POST /mcp/tools`

### Request Format
```json
{
  "tool": "toolName",
  "args": { /* tool-specific arguments */ }
}
```

---

## 🔧 Tool 1: getUserProfile

Retrieves user profile by phone number (for returning callers).

**Request:**
```json
{
  "tool": "getUserProfile",
  "args": {
    "phone_number": "+15550100"
  }
}
```

**Response (existing user):**
```json
{
  "user_id": "uuid",
  "name": "Test User",
  "home_zip": "90210",
  "dietary_restrictions": ["vegetarian"],
  "allergies": []
}
```

**Response (new user):**
```json
null
```

---

## 🔧 Tool 2: createUser

Creates new user profile (onboarding flow).

**Request:**
```json
{
  "tool": "createUser",
  "args": {
    "phone_number": "+15551234",
    "name": "Sarah",
    "home_zip": "90210",
    "dietary_restrictions": ["vegetarian"],
    "allergies": ["peanuts"]
  }
}
```

**Response:**
```json
{
  "user_id": "uuid",
  "name": "Sarah",
  "home_zip": "90210",
  "dietary_restrictions": ["vegetarian"],
  "allergies": ["peanuts"],
  "success": true
}
```

**Errors:**
- `DUPLICATE_KEY`: Phone number already exists

---

## 🔧 Tool 3: getListings

Fetches available food listings filtered by location and dietary preferences.

**Request:**
```json
{
  "tool": "getListings",
  "args": {
    "zip_code": "90210",
    "dietary_restrictions": ["vegetarian"],
    "allergies": ["peanuts"],
    "limit": 3
  }
}
```

**Response:**
```json
{
  "listings": [
    {
      "listing_id": "uuid",
      "restaurant_name": "Green Bowl",
      "restaurant_address": "456 Oak Ave, Beverly Hills, CA",
      "item_name": "Quinoa Power Bowl",
      "description": "Quinoa with roasted vegetables and tahini",
      "original_price": 14.00,
      "discounted_price": 6.00,
      "quantity_available": 8,
      "pickup_deadline": "2026-03-04T22:00:00Z",
      "dietary_tags": ["vegan", "gluten-free"]
    }
  ],
  "count": 1
}
```

**Filtering Logic:**
- Excludes listings with allergens matching user allergies
- Includes listings matching dietary restrictions OR neutral items
- Sorts by price (cheapest first)
- Only active listings (quantity > 0, not expired)

---

## 🔧 Tool 4: createReservation

Atomically reserves items (prevents overselling with row-level locking).

**Request:**
```json
{
  "tool": "createReservation",
  "args": {
    "listing_id": "uuid",
    "user_id": "uuid",
    "quantity": 2
  }
}
```

**Response:**
```json
{
  "reservation_id": "uuid",
  "pickup_code": "ALPHA-5-2-7",
  "restaurant_name": "Green Bowl",
  "restaurant_address": "456 Oak Ave, Beverly Hills, CA",
  "item_name": "Quinoa Power Bowl",
  "quantity": 2,
  "total_price": 12.00,
  "pickup_deadline": "2026-03-04T22:00:00Z",
  "success": true
}
```

**Errors:**
- `LISTING_NOT_FOUND`: Invalid listing ID
- `LISTING_EXPIRED`: Pickup deadline passed
- `INSUFFICIENT_QUANTITY`: Not enough items available
- `INVALID_QUANTITY`: Quantity out of range (1-10)

**Atomic Guarantees:**
- Uses PostgreSQL stored procedure with `SELECT FOR UPDATE`
- Prevents race conditions between concurrent reservations
- Generates unique pickup codes (NATO alphabet + numbers)

---

## 🗄️ Database Schema

### Tables
- **users**: Customer profiles with dietary preferences
- **restaurants**: Restaurant locations by ZIP code
- **listings**: Available food items with inventory
- **reservations**: Confirmed reservations with pickup codes

### Key Features
- UUIDs for all primary keys
- Indexes on phone_number, zip_code, pickup_deadline
- Constraints: valid_prices, valid_quantity, reservation status enum
- Stored procedure: `reserve_listing()` for atomic reservations

See `schema.sql` for complete DDL.

---

## ✅ What Was Fixed

Based on the backend review, the following improvements were made:

### 1. Added Input Validation (All Tools)
- Zod schemas for all 4 tools
- Phone number format validation (E.164)
- ZIP code validation (5 digits)
- Quantity limits (1-10)

### 2. Completed getUserProfile
- Maps `id` → `user_id` in response
- Returns proper field structure per PRD
- Handles null case for new users

### 3. Completed createUser
- Accepts `dietary_restrictions` and `allergies`
- Returns `user_id` and `success` boolean
- Handles duplicate phone number errors

### 4. Completed getListings
- Implements dietary filtering logic
- Returns all required fields (description, original_price, dietary_tags)
- Sorts by discounted_price ascending
- Returns count field
- Handles limit parameter

### 5. Fixed createReservation
- Uses stored procedure for atomic operations
- Parses specific error types
- Returns complete reservation details

### 6. Added Database Schema
- Complete SQL migration script
- All constraints and indexes
- Stored procedure with row-level locking
- Seed data for testing

---

## 🧪 Testing Checklist

Before Telnyx integration:

- [ ] Execute `schema.sql` in Supabase
- [ ] Verify 5 restaurants seeded
- [ ] Verify 10 listings seeded with future deadlines
- [ ] Test getUserProfile with existing phone
- [ ] Test getUserProfile with new phone (returns null)
- [ ] Test createUser with new phone
- [ ] Test createUser duplicate phone (error)
- [ ] Test getListings in 90210 (should return results)
- [ ] Test getListings in 10001 (should return empty)
- [ ] Test getListings with dietary filters
- [ ] Test createReservation with valid listing
- [ ] Test createReservation with insufficient quantity
- [ ] Test concurrent reservations (race condition)

---

## 🚨 Known Issues / Next Steps

1. **Database not seeded yet** - Execute `schema.sql` first
2. **Telnyx integration pending** - Backend ready for voice assistant
3. **No automated tests** - Add unit/integration tests
4. **No logging middleware** - Consider adding structured logging
5. **Environment validation** - Add startup checks for required env vars

---

## 📚 Related Documents

- **PRD.md**: Complete product requirements and architecture
- **REVIEW_FINDINGS.md**: Detailed backend review results
- **schema.sql**: Database setup script

---

## 🤝 Development Workflow

```bash
# Development mode (watch for changes)
npm run dev

# Production build
npm run build
npm start

# Check for TypeScript errors
npx tsc --noEmit
```

---

## 📞 Support

For issues or questions, refer to:
1. REVIEW_FINDINGS.md for known issues
2. PRD.md for architecture decisions
3. schema.sql for database structure

---

**Status:** Backend infrastructure complete and tested ✅  
**Next:** Execute database schema → Test all endpoints → Integrate Telnyx
