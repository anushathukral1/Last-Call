# Last Call 🍽️📞

A voice-first app that helps you discover and reserve discounted surplus food from local restaurants before they close. Just call the AI assistant, hear available meals near you, and get an instant pickup code — no app required.

## 📞 Try It Now

**Call: +1 (604) 742-9190**

The AI assistant will:
1. Recognize if you're a returning caller or new user
2. Ask for your location and dietary preferences (if new)
3. Read out nearby discounted meal options
4. Let you reserve items and get an instant pickup code

## 🚀 What This Project Does

Last Call connects hungry people with restaurants that have surplus food at the end of the day. Instead of food going to waste, users can call a phone number and talk to an AI assistant powered by [Telnyx](https://telnyx.com/) to:

- **Discover** available discounted meals near their location
- **Filter** by dietary preferences and allergies
- **Reserve** items instantly with atomic inventory management
- **Pickup** food before closing using a unique code

All interactions happen over voice — no mobile app, no website login, just a simple phone call.

## 🏗️ Backend Architecture

### Tech Stack
- **Express.js** - HTTP server handling webhook endpoints
- **TypeScript** - Type-safe backend code
- **Supabase (PostgreSQL)** - Database for users, restaurants, listings, and reservations
- **Telnyx AI Assistant** - Voice interface with function calling
- **Zod** - Runtime validation for all API inputs

### Architecture Overview

```
┌─────────────┐
│   Caller    │
│  (Phone)    │
└──────┬──────┘
       │ Dials +1 (604) 742-9190
       ▼
┌──────────────────────┐
│  Telnyx AI Assistant │ ◄── Natural language voice interface
│  (Function Calling)  │
└──────┬───────────────┘
       │ HTTP Webhooks
       ▼
┌──────────────────────┐
│   Express Server     │
│  (Backend API)       │
├──────────────────────┤
│ /telnyx/dynamic-variables  ← Call initialization (identify caller)
│ /telnyx/tools/getUserProfile  ← Fetch user profile
│ /telnyx/tools/createUser      ← Onboard new user
│ /telnyx/tools/getListings     ← Search available food
│ /telnyx/tools/createReservation ← Reserve items atomically
└──────┬───────────────┘
       │ Supabase Client
       ▼
┌──────────────────────┐
│  PostgreSQL (Supabase)│
├──────────────────────┤
│ • users              │ ← Phone, name, zip, dietary prefs
│ • restaurants        │ ← Name, address, zip code
│ • listings           │ ← Food items with inventory
│ • reservations       │ ← Confirmed orders with pickup codes
└──────────────────────┘
```

### Key Features

**1. Dynamic Variables Endpoint** (`/telnyx/dynamic-variables`)
- Receives call initiation webhook from Telnyx
- Looks up caller by phone number in the database
- Returns user context (name, home zip) or flags as new user
- Allows AI assistant to personalize the conversation

**2. Function Calling Tools** (4 endpoints under `/telnyx/tools/`)
- **getUserProfile**: Fetch user profile by phone number
- **createUser**: Onboard new user with dietary preferences
- **getListings**: Query available food filtered by location, diet, allergies
- **createReservation**: Atomically reserve items with row-level locking to prevent overselling

**3. Atomic Reservation System**
- Uses PostgreSQL stored procedure with `SELECT FOR UPDATE`
- Prevents race conditions when multiple people try to reserve the same item
- Generates unique pickup codes using NATO alphabet (e.g., "ALPHA-5-2-7")
- Decrements inventory and locks rows during transaction

**4. Dietary Filtering**
- Excludes items containing user's allergens
- Includes items matching dietary restrictions (vegetarian, vegan, gluten-free, etc.)
- Neutral items without tags are always included

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)
- Telnyx account with AI Assistant configured (optional for local testing)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
```

### 3. Setup Database
Execute the `schema.sql` file in your Supabase SQL Editor:
- Creates all 4 tables with indexes and constraints
- Creates `reserve_listing()` stored procedure for atomic reservations
- Seeds 5 restaurants and 10 food listings
- Seeds 1 test user (+15550100)

**Note:** Seed data sets listing deadlines to 3 hours from execution time.

### 4. Build and Run
```bash
npm run build
npm start
```

Server runs on `http://localhost:3000`

### 5. Test the API
```bash
# Health check
curl http://localhost:3000/health

# Get user profile (test user)
curl -X POST http://localhost:3000/telnyx/tools/getUserProfile \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"+15550100"}'

# Get listings in Beverly Hills (90210)
curl -X POST http://localhost:3000/telnyx/tools/getListings \
  -H "Content-Type: application/json" \
  -d '{"zip_code":"90210","limit":5}'
```

## 📂 Project Structure

```
last-call/
├── src/
│   ├── index.ts                  # Express server entry point
│   ├── db/
│   │   └── supabase.ts           # Supabase client config
│   ├── routes/
│   │   ├── health.ts             # Health check endpoint
│   │   ├── dynamicVariables.ts   # Telnyx call init webhook
│   │   ├── telnyxTools.ts        # Tool endpoints for AI assistant
│   │   └── mcp.ts                # MCP-compatible tool router
│   ├── tools/
│   │   ├── getUserProfile.ts     # Fetch user by phone
│   │   ├── createUser.ts         # Onboard new user
│   │   ├── getListings.ts        # Search food listings
│   │   └── createReservation.ts  # Reserve items atomically
│   └── utils/
│       ├── normalizePhoneNumber.ts  # E.164 phone validation
│       └── normalizePickupCode.ts   # Unique code generation
├── public/
│   ├── index.html                # Landing page
│   └── styles.css                # Landing page styles
├── schema.sql                    # Complete database setup
├── .env.example                  # Environment template
└── README.md                     # This file
```

## 🔧 API Endpoints

### Telnyx Webhooks

**POST /telnyx/dynamic-variables**
- Receives call initialization from Telnyx
- Returns caller context for personalization

**POST /telnyx/tools/getUserProfile**
```json
{ "phone_number": "+15551234567" }
```
Returns user profile or `null` if new caller.

**POST /telnyx/tools/createUser**
```json
{
  "phone_number": "+15551234567",
  "name": "Sarah",
  "home_zip": "90210",
  "dietary_restrictions": ["vegetarian"],
  "allergies": ["peanuts"]
}
```
Creates new user profile.

**POST /telnyx/tools/getListings**
```json
{
  "zip_code": "90210",
  "dietary_restrictions": ["vegetarian"],
  "allergies": ["peanuts"],
  "limit": 5
}
```
Returns filtered food listings sorted by price.

**POST /telnyx/tools/createReservation**
```json
{
  "listing_id": "uuid",
  "user_id": "uuid",
  "quantity": 2
}
```
Atomically reserves items and returns pickup code.

## 🧪 Development

```bash
# Watch mode (auto-rebuild on changes)
npm run dev

# Production build
npm run build

# Start server
npm start

# Type checking
npx tsc --noEmit
```

## 🎯 Use Cases

- **Consumers**: Save money on quality meals while reducing food waste
- **Restaurants**: Recover revenue from surplus inventory instead of throwing it away
- **Environment**: Less food waste = lower carbon footprint
- **Accessibility**: Voice interface works for everyone, no smartphone required

## 📝 Notes

- The phone number (+1 604-742-9190) requires Telnyx configuration to work
- On Telnyx trial accounts, you need to verify caller numbers first
- Database seed data creates listings with 3-hour pickup windows
- Atomic reservations prevent overselling during high traffic
- All phone numbers must be in E.164 format (+1234567890)

## 🔮 Future Enhancements

- Real-time notifications when nearby restaurants post new listings
- SMS confirmation with pickup details
- Restaurant dashboard for managing listings
- Multi-language support
- Integration with Google Maps for directions

---

**Built with** Express, TypeScript, Supabase, and Telnyx AI Assistant 💚
