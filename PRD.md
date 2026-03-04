# Product Requirements Document: Last Call

**Version:** 1.0  
**Date:** March 2, 2026  
**Project Type:** Telnyx Voice AI + MCP Coding Challenge  
**Status:** Draft

---

## 1. Overview

**Last Call** is a voice-first surplus food discovery system that helps consumers find and reserve discounted meals from nearby restaurants before closing time. Users call a dedicated phone number to interact with a Telnyx AI Assistant that helps them discover available meals, filter based on dietary preferences, and complete reservations—all through natural conversation.

The system reduces food waste by connecting consumers with restaurants' surplus inventory while providing restaurants an automated channel to sell excess food at the end of the day.

### Value Proposition
- **For Consumers:** Save money on quality meals while reducing food waste through a simple phone call
- **For Restaurants:** Automated surplus food sales without manual intervention (seeded data in MVP)
- **For Environment:** Reduce food waste through efficient surplus redistribution

---

## 2. Goals and Non-Goals

### Goals
- ✅ Enable consumers to discover and reserve surplus food via voice
- ✅ Demonstrate Telnyx AI Assistant with Dynamic Webhook Variables
- ✅ Build custom MCP server with well-defined tool schemas
- ✅ Implement atomic reservation system to prevent overselling
- ✅ Support both first-time and returning users seamlessly
- ✅ Deploy fully functional public demo

### Non-Goals (Out of Scope for MVP)
- ❌ Restaurant onboarding or calling interface
- ❌ Payment processing (pickup assumed to be pay-on-arrival)
- ❌ Real-time restaurant inventory updates
- ❌ SMS/email notifications
- ❌ Multi-language support
- ❌ Rating/review system
- ❌ Delivery or special instructions
- ❌ Web or mobile app interface

---

## 3. Personas

### Primary Persona: Sarah the Budget-Conscious Consumer
**Demographics:**
- Age: 25-45
- Urban resident
- Value-conscious, environmentally aware
- Comfortable with phone-based services

**Goals:**
- Find affordable meals near home or current location
- Avoid wasting money on expensive takeout
- Support local restaurants

**Pain Points:**
- Doesn't know which restaurants have surplus food
- Doesn't want to call multiple places
- Worried about missing dietary restrictions

**Use Case:**
Sarah calls Last Call around 7 PM while commuting home. She quickly learns about 3 nearby options, reserves a vegetarian meal from a local Italian restaurant, and picks it up on her way home with her pickup code.

---

## 4. User Flows

### Flow A: First-Time User (Cold Start)
```
1. User calls Last Call phone number
2. System detects unknown phone number
3. AI: "Welcome to Last Call! I help you find discounted meals near you. 
   To get started, what's your name?"
4. User: "I'm Sarah"
5. AI: "Nice to meet you, Sarah! What's your home ZIP code?"
6. User: "90210"
7. AI: "Do you have any dietary restrictions or allergies I should know about?"
8. User: "I'm vegetarian"
9. AI: "Got it! You're all set. Now, are you looking for food near 90210 today?"
10. User: "Yes"
11. [Continue to Flow C: Browse & Reserve]
```

### Flow B: Returning User
```
1. User calls Last Call phone number
2. System recognizes phone number → fetches user profile
3. AI: "Welcome back, Sarah! Are you looking for food near your home ZIP 90210 today, 
   or somewhere else?"
4. User: "90210 is fine"
5. [Continue to Flow C: Browse & Reserve]
```

### Flow C: Browse & Reserve (Common Path)
```
1. AI fetches listings matching:
   - ZIP code (90210)
   - Available quantity > 0
   - Not expired
   - Dietary match (vegetarian)
2. AI: "I found 3 options near you:
   1. Mama Mia Italian - Veggie pasta for $8, pickup by 9 PM
   2. Green Bowl - Mixed salad for $6, pickup by 8:30 PM
   3. The Corner Cafe - Vegetarian wrap for $5, pickup by 10 PM
   Which sounds good?"
3. User: "I'll take option 1"
4. AI: "How many would you like?"
5. User: "Two"
6. System atomically reserves 2 veggie pastas
7. AI: "Perfect! Your pickup code is ALPHA-5-2-7. Pick up at Mama Mia Italian, 
   123 Main St, by 9 PM tonight. Anything else?"
8. User: "No thanks"
9. AI: "Great! Enjoy your meal and thanks for reducing food waste!"
```

### Flow D: No Results Found
```
1. User provides ZIP code
2. System finds 0 matching listings
3. AI: "Sorry, I don't have any available listings near you right now. 
   Try calling back in a bit or during dinner hours. Have a great day!"
```

### Flow E: Out of Stock During Reservation
```
1. User selects listing
2. Between fetch and reserve, another caller takes last item
3. AI: "Oops, that item just got claimed! But I still have:
   - Green Bowl salad for $6
   - The Corner Cafe wrap for $5
   Would you like one of these instead?"
```

---

## 5. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Consumer)                          │
│                    Calls: +1-XXX-XXX-XXXX                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Voice Call
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TELNYX AI ASSISTANT                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Configuration:                                           │  │
│  │  - Voice: en-US female                                    │  │
│  │  - Language: English                                      │  │
│  │  - Dynamic Webhook Variables: phone_number               │  │
│  │  - Webhook URL: https://lastcall.render.com/webhook      │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Webhook
                             │ (Contains: phone_number, conversation state)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXPRESS API SERVER                           │
│                  (Node.js + TypeScript)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Endpoints:                                               │  │
│  │  - POST /webhook → handles Telnyx events                 │  │
│  │  - POST /mcp/tools → MCP tool execution                  │  │
│  │  - GET /health → health check                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  MCP Server (Custom)                                      │  │
│  │  Tools:                                                   │  │
│  │  - getUserProfile(phone_number)                          │  │
│  │  - createUser(name, zip, dietary_prefs)                  │  │
│  │  - getListings(zip, dietary_prefs)                       │  │
│  │  - createReservation(listing_id, quantity, user_id)      │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ SQL Queries
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE POSTGRES DB                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Tables:                                                  │  │
│  │  - users                                                  │  │
│  │  - restaurants                                            │  │
│  │  - listings                                               │  │
│  │  - reservations                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

DEPLOYMENT: Render/Railway (Public HTTPS endpoint)
```

### Data Flow Example
1. User calls → Telnyx AI Assistant answers
2. AI determines need for user lookup → calls webhook with phone_number
3. Express server receives webhook → invokes MCP tool `getUserProfile`
4. MCP queries Supabase → returns user data (or null if new)
5. Express responds to Telnyx → AI continues conversation
6. User requests listings → AI calls webhook again
7. Express invokes MCP tool `getListings` with ZIP + dietary prefs
8. MCP queries Supabase → returns available listings
9. User makes selection → AI calls webhook for reservation
10. Express invokes MCP tool `createReservation` (with transaction)
11. MCP atomically updates listing quantity & creates reservation
12. Express responds with pickup code → AI reads it to user

---

## 6. MCP Tool Definitions

### Tool 1: getUserProfile
**Description:** Retrieves user profile by phone number

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "phone_number": {
      "type": "string",
      "pattern": "^\\+?[1-9]\\d{1,14}$",
      "description": "E.164 formatted phone number"
    }
  },
  "required": ["phone_number"]
}
```

**Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "user_id": { "type": "string", "format": "uuid" },
    "name": { "type": "string" },
    "home_zip": { "type": "string" },
    "dietary_restrictions": {
      "type": "array",
      "items": { "type": "string" }
    },
    "allergies": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "nullable": true
}
```

**Error Cases:**
- Returns `null` if user not found (new caller)
- Throws if database connection fails

---

### Tool 2: createUser
**Description:** Creates new user profile (onboarding)

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "phone_number": {
      "type": "string",
      "pattern": "^\\+?[1-9]\\d{1,14}$"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "home_zip": {
      "type": "string",
      "pattern": "^\\d{5}$"
    },
    "dietary_restrictions": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },
    "allergies": {1},
    "success": { "type": "boolean" }
  },
  "required": ["user_id", "success"]
}
```

**Error Cases:**
- Throws if phone_number already exists (duplicate)
- Throws if validation fails (Zod)

---

### Tool 3: getListings
**Description:** Fetches available surplus food listings

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "zip_code": {
      "type": "string",
      "pattern": "^\\d{5}$"
    },
    "dietary_restrictions": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },
    "allergies": {
      "type": "array",
      "items": { "type": "string" },
      "default": []
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10,
      "default": 3
    }
  },
  "required": ["zip_code"]
}
```

**Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "listings": {
      "type": "array",
      "maxItems": 10,
      "items": {
        "type": "object",
        "properties": {
          "listing_id": { "type": "string", "format": "uuid" },
          "restaurant_name": { "type": "string" },
          "restaurant_address": { "type": "string" },
          "item_name": { "type": "string" },
          "description": { "type": "string" },
          "original_price": { "type": "number" },
          "discounted_price": { "type": "number" },
          "quantity_available": { "type": "integer" },
          "pickup_deadline": { "type": "string", "format": "date-time" },
          "dietary_tags": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": [
          "listing_id",
          "restaurant_name",
          "item_name",
          "discounted_price",
          "quantity_available",
          "pickup_deadline"
        ]
      }
    },
    "count": { "type": "integer" }
  },
  "required": ["listings", "count"]
}
```

**Filtering Logic:**
- ZIP code exact match (restaurants.zip_code)
- quantity_remaining > 0
- pickup_deadline > NOW()
- If dietary restrictions provided: listings must have matching tags OR no conflicting tags
- If allergies provided: listings must NOT contain allergy tags
- ORDER BY discounted_price ASC
- LIMIT 3 (default)

**Error Cases:**
- Returns empty array if no matches
- Throws if database query fails

---

### Tool 4: createReservation
**Description:** Atomically creates reservation and updates inventory

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "listing_id": {
      "type": "string",
      "format": "uuid"
    },
    "user_id": {
      "type": "string",
      "format": "uuid"
    },
    "quantity": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10
    }
  },
  "required": ["listing_id", "user_id", "quantity"]
}
```

**Output Schema:**
```json
{
  "type": "object",
  "properties": {
    "reservation_id": { "type": "string", "format": "uuid" },
    "pickup_code": {
      "type": "string",
      "pattern": "^[A-Z]+-\\d+-\\d+-\\d+$",
      "description": "Format: WORD-NUM-NUM-NUM (e.g., ALPHA-5-2-7)"
    },
    "restaurant_name": { "type": "string" },
    "restaurant_address": { "type": "string" },
    "item_name": { "type": "string" },
    "quantity": { "type": "integer" },
    "total_price": { "type": "number" },
    "pickup_deadline": { "type": "string", "format": "date-time" },
    "success": { "type": "boolean" }
  },
  "required": [
    "reservation_id",
    "pickup_code",
    "restaurant_name",
    "item_name",
    "quantity",
    "pickup_deadline",
    "success"
  ]
}
```

**Transaction Logic:**
1. BEGIN TRANSACTION
2. SELECT quantity_remaining FROM listings WHERE id = listing_id FOR UPDATE
3. IF quantity_remaining < requested_quantity → ROLLBACK, throw error
4. UPDATE listings SET quantity_remaining = quantity_remaining - quantity
5. INSERT INTO reservations (...)
6. COMMIT
7. Generate pickup_code (phonetically distinct words + numbers)

**Error Cases:**
- Throws `INSUFFICIENT_QUANTITY` if not enough inventory
- Throws `LISTING_NOT_FOUND` if listing_id invalid
- Throws `LISTING_EXPIRED` if pickup_deadline passed
- Throws if user_id invalid

---

## 7. Data Model

### Table: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  home_zip VARCHAR(5) NOT NULL,
  dietary_restrictions TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone_number);
```

### Table: restaurants
```sql
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  address VARCHAR(300) NOT NULL,
  zip_code VARCHAR(5) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_restaurants_zip ON restaurants(zip_code);
```

### Table: listings
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  description TEXT,
  original_price DECIMAL(10,2) NOT NULL,
  discounted_price DECIMAL(10,2) NOT NULL,
  quantity_total INTEGER NOT NULL,
  quantity_remaining INTEGER NOT NULL,
  dietary_tags TEXT[] DEFAULT '{}',
  allergen_tags TEXT[] DEFAULT '{}',
  pickup_deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_prices CHECK (discounted_price <= original_price),
  CONSTRAINT valid_quantity CHECK (quantity_remaining >= 0 AND quantity_remaining <= quantity_total)
);

CREATE INDEX idx_listings_restaurant ON listings(restaurant_id);
CREATE INDEX idx_listings_deadline ON listings(pickup_deadline);
CREATE INDEX idx_listings_available ON listings(quantity_remaining) WHERE quantity_remaining > 0;
```

### Table: reservations
```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10,2) NOT NULL,
  pickup_code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'picked_up', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_listing ON reservations(listing_id);
CREATE INDEX idx_reservations_code ON reservations(pickup_code);
CREATE INDEX idx_reservations_status ON reservations(status);
```

### Seed Data Examples

**Restaurants (5 sample):**
- Mama Mia Italian (90210, Italian cuisine)
- Green Bowl (90210, Healthy/Salads)
- The Corner Cafe (90210, American)
- Sushi Express (90211, Japanese)
- Taco Fiesta (90212, Mexican)

**Listings (10-15 sample across restaurants):**
- Mix of vegetarian, vegan, gluten-free, contains-nuts options
- Prices: $5-$15
- Quantities: 3-10 items
- Deadlines: 8 PM - 10 PM same day

---

## 8. Error Handling and Edge Cases

### 8.1 User Input Errors
| Scenario | Handling |
|----------|----------|
| Invalid ZIP code format | AI: "I didn't catch that ZIP code. Can you repeat the 5-digit code?" |
| Gibberish name | AI accepts anything, stores as-is (user's choice) |
| No dietary restrictions | Empty array stored, no filtering applied |
| Unclear selection (e.g., "the first one" vs "option 1") | AI uses NLU to map to listing, asks for clarification if ambiguous |

### 8.2 Data Edge Cases
| Scenario | Handling |
|----------|----------|
| No listings in ZIP code | Return empty array → AI: "Sorry, no listings available right now" |
| All listings expired | Filtered out by query → empty result |
| Listing expired mid-call | createReservation throws LISTING_EXPIRED → AI: "That listing just expired" |
| Quantity = 0 mid-call | createReservation throws INSUFFICIENT_QUANTITY → AI offers alternatives |

### 8.3 Race Conditions
| Scenario | Handling |
|----------|----------|
| 2 users reserve last item simultaneously | Row-level locking (FOR UPDATE) + transaction ensures atomic decrement |
| Overselling prevention | Database constraint: quantity_remaining >= 0, transaction rolls back if violated |

### 8.4 System Errors
| Scenario | Handling |
|----------|----------|
| Database connection timeout | MCP tool throws error → Express catches → Telnyx webhook response includes error → AI: "Sorry, technical issue, try again" |
| Invalid webhook payload | Express validation middleware rejects with 400 |
| MCP server unreachable | Express returns 503 → AI: "System temporarily unavailable" |
| Webhook timeout (Telnyx 10s limit) | Queries optimized with indexes, fallback: AI says "Taking longer than expected, try again" |

### 8.5 Business Logic Edge Cases
| Scenario | Handling |
|----------|----------|
| User requests 100 items | Zod validation caps quantity at 10 → throws error → AI: "Max 10 items per reservation" |
| User calls after 11 PM | Listings likely expired → empty results → AI: "Try calling during dinner hours (5-9 PM)" |
| User provides ZIP outside service area | No listings returned → AI: "Not available in that area yet" |
| Duplicate phone number signup | createUser throws DUPLICATE_KEY → AI: "You already have an account" |

---

## 9. Demo Plan

### 9.1 Demo Script: First-Time User (Happy Path)
**Objective:** Show onboarding + full reservation flow

**Steps:**
1. Call from new number: +1-555-0100
2. AI welcomes, asks for name
3. Say: "Alex"
4. AI asks for home ZIP
5. Say: "90210"
6. AI asks for dietary restrictions
7. Say: "I'm allergic to peanuts"
8. AI confirms, asks for current ZIP
9. Say: "90210"
10. AI presents 3 listings (e.g., pasta, salad, wrap - no peanuts)
11. Say: "I'll take the second one"
12. AI asks quantity
13. Say: "One"
14. AI confirms reservation, provides pickup code "BRAVO-3-8-2"
15. AI reads restaurant address and deadline
16. Say: "Thank you"
17. AI ends call

**Expected Result:** Reservation created, quantity decremented in DB

---

### 9.2 Demo Script: Returning User
**Objective:** Show profile recognition

**Steps:**
1. Call from same number: +1-555-0100
2. AI: "Welcome back, Alex! Looking for food near 90210 today?"
3. Say: "Actually, I'm in 90211"
4. AI fetches listings for 90211 (filtered by peanut allergy)
5. Continue reservation flow

**Expected Result:** No re-onboarding, smooth experience

---

### 9.3 Demo Script: Out of Stock
**Objective:** Show race condition handling

**Steps:**
1. Call from user: +1-555-0101
2. Complete onboarding (Bob, 90210)
3. AI presents listing with quantity_remaining = 1
4. Say: "I'll take option 1"
5. MEANWHILE: Manually update DB to set quantity_remaining = 0
6. Say quantity: "Two"
7. AI attempts reservation → MCP throws INSUFFICIENT_QUANTITY
8. AI: "Sorry, that just got claimed. Would you like something else?"

**Expected Result:** Graceful failure, no overselling

---

### 9.4 Demo Script: No Results
**Objective:** Show empty state

**Steps:**
1. Call from new number: +1-555-0102
2. Complete onboarding (Charlie, 10001 - NYC ZIP not in seed data)
3. AI: "Sorry, no listings in your area right now"

**Expected Result:** Clean empty state handling

---

### 9.5 Pre-Demo Checklist
- [ ] Deploy backend to Render/Railway with public HTTPS endpoint
- [ ] Configure Telnyx AI Assistant with webhook URL
- [ ] Seed database with 5 restaurants + 15 listings
- [ ] Set listing deadlines to 2 hours from demo time
- [ ] Test phone number provisioned and active
- [ ] Verify MCP server responds to all 4 tools
- [ ] Test with 2 concurrent calls for race condition demo

---

## 10. Acceptance Criteria

### ✅ Functional Requirements
- [ ] Telnyx AI Assistant answers calls and conducts natural conversation
- [ ] Dynamic Webhook Variables (phone_number) captured and passed to backend
- [ ] First-time users complete onboarding (name, ZIP, dietary info)
- [ ] Returning users recognized by phone number, skip onboarding
- [ ] AI asks for current ZIP every call to confirm location
- [ ] getListings returns ≤3 results filtered by ZIP, availability, dietary match
- [ ] Listings show: restaurant name, item, price, deadline
- [ ] User can select listing and specify quantity (1-10)
- [ ] createReservation atomically decrements quantity and creates reservation
- [ ] System prevents overselling via database transactions
- [ ] User receives pickup code (format: WORD-NUM-NUM-NUM)
- [ ] AI reads restaurant address and pickup deadline
- [ ] No code or expired listings displayed

### ✅ Technical Requirements
- [ ] Custom MCP server with 4 tools: getUserProfile, createUser, getListings, createReservation
- [ ] All MCP tools use Zod validation for input/output
- [ ] Express backend with /webhook endpoint handling Telnyx events
- [ ] Supabase Postgres with 4 tables: users, restaurants, listings, reservations
- [ ] Database uses UUIDs for primary keys
- [ ] Row-level locking (FOR UPDATE) on listings during reservation
- [ ] Indexes on: phone_number, zip_code, pickup_deadline, quantity_remaining
- [ ] Constraints: valid_prices, valid_quantity, reservation status enum
- [ ] Backend deployed to public HTTPS endpoint (Render/Railway)
- [ ] Environment variables for: DATABASE_URL, PORT, TELNYX_API_KEY

### ✅ Edge Case Handling
- [ ] Empty listings array handled gracefully (no results)
- [ ] Race condition: last item claimed → INSUFFICIENT_QUANTITY error
- [ ] Expired listing mid-call → appropriate error message
- [ ] Invalid ZIP format → AI asks for re-entry
- [ ] Quantity > quantity_remaining → transaction rollback
- [ ] Database connection failure → 503 response
- [ ] Webhook timeout (>10s) → optimized queries prevent

### ✅ Demo Criteria
- [ ] Demo script #1 (first-time user) completes successfully
- [ ] Demo script #2 (returning user) shows profile recognition
- [ ] Demo script #3 (out of stock) shows race condition handling
- [ ] Demo script #4 (no results) shows empty state
- [ ] 5 restaurants seeded in database
- [ ] 10-15 listings seeded with varied dietary tags
- [ ] Pickup codes are unique and phonetically clear
- [ ] Multiple concurrent calls handled without overselling

### ✅ Deployment Criteria
- [ ] Backend accessible via public HTTPS URL
- [ ] Telnyx phone number provisioned and configured
- [ ] AI Assistant configured with correct webhook URL
- [ ] Database tables created with proper schema
- [ ] Seed data loaded successfully
- [ ] Health check endpoint responds with 200
- [ ] Logs accessible for debugging

---

## Appendix: Technology Stack Summary

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Voice AI | Telnyx AI Assistant | Challenge requirement, handles NLU + TTS |
| Backend | Node.js + TypeScript | Fast development, strong typing, MCP SDK available |
| Web Framework | Express | Lightweight, flexible webhook handling |
| Database | Supabase Postgres | Managed Postgres, free tier, excellent DX |
| Validation | Zod | Type-safe validation matching TypeScript |
| MCP Server | Node.js SDK | Official SDK, well-documented |
| Deployment | Render/Railway | Free tier, auto HTTPS, GitHub integration |
| Version Control | Git + GitHub | Standard, enables CI/CD |

---

## Next Steps

1. **Review & Approve:** Product/tech leads review this PRD
2. **Technical Design:** Create detailed API specs and sequence diagrams
3. **Setup:** Initialize repo, configure Supabase, provision Telnyx number
4. **Implementation:** Build backend → MCP server → Telnyx integration
5. **Testing:** Unit tests → Integration tests → Voice call testing
6. **Deployment:** Deploy to Render/Railway, configure webhooks
7. **Demo:** Run all 4 demo scripts, record video
8. **Documentation:** Write README with setup instructions
9. **Submission:** Package for Telnyx challenge submission

---

**Document End**
