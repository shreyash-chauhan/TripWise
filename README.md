# TripWise — Smart Travel Planner
> **Full-Stack Web Development Recruitment Task**  
> **AWS Student Builder Group, VIT Chennai**

TripWise is a modern, high-performance, editorial travel-planning web application designed to help travellers discover real world destinations, explore authentic historical and cultural landmarks, and curate personal itineraries that persist across browser refreshes and server restarts.

---

## 🌟 Key Highlights & Features

1. **Live External Places Discovery**:
   - Integrated with **OpenStreetMap (Nominatim)** and the **Wikipedia REST API** for live geocoding, coordinates, and factual place summaries.
   - Optional integration with **Geoapify Places API** and **OpenTripMap**.
   - Built-in SQLite cache layer adhering to external API usage policies while delivering sub-millisecond responses.
2. **Search by Keyword or City**:
   - Instant search with auto-debounce and quick-suggestion destination chips (*Kyoto, Paris, Rome, Bali, Cairo, Mahabalipuram, San Francisco, Banff*).
3. **Category Filtering**:
   - Filter across *Historical & Landmarks*, *Nature & Parks*, *Arts & Culture*, *Food & Dining*, *Coastal & Beaches*, *Architecture*, and *Modern & Urban*.
4. **Multi-Criterion Sorting**:
   - Sort by *Recommended & Curated*, *Rating (Highest first)*, *Name (A → Z)*, *Name (Z → A)*, and *Category*.
5. **Interactive Destination Details Modal**:
   - High-resolution photography with fallback error handlers.
   - Factual Wikipedia descriptive extracts and exact latitude/longitude coordinates.
   - One-click navigation links to **Google Maps** and **OpenStreetMap Registry**.
   - Direct trip planning: add planned visit date and personal notes.
6. **Persistent Personal Itinerary**:
   - Fully backed by an embedded **SQLite** database (`node:sqlite`).
   - Add/remove destinations with instant optimistic UI updates and toast feedback.
   - Custom trip planning: schedule visit dates and write personal trip notes.
   - Inline notes editor directly within the "My Trip" view.
7. **Itinerary Export & Print**:
   - Export your itinerary to clean GitHub-Flavored Markdown, download as JSON, or print directly.
8. **Responsive Editorial Design**:
   - Custom editorial aesthetic: deep forest-green accents (`#0F382C`), warm off-white background (`#FAF8F5`), amber highlights (`#D97706`), and crisp typography.
   - Polished mobile navigation, loading skeletons with pulse shimmer, empty state with filters reset, and recoverable error state.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 19 + Vite 8 + TypeScript | Blazing fast HMR, strict type safety, modern modular architecture |
| **Styling** | Tailwind CSS v4 | Clean utility classes, zero runtime overhead, custom design tokens |
| **Icons** | Lucide React | Modern, accessible travel and UI iconography |
| **Backend** | Node.js (v24) + Express | Lightweight, reliable RESTful API server with TypeScript execution |
| **Database** | SQLite (`node:sqlite`) | High-performance embedded SQL database with WAL mode and zero binary dependencies |
| **External APIs** | OpenStreetMap Nominatim + Wikipedia REST API | Live global geocoding, authentic descriptions, real coordinates, zero fabricated data |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v20+ recommended, v22.5+ or v24 built-in SQLite supported)
- **npm** (v10+)

### 1. Installation
Clone the repository and install all dependencies:

```bash
# In project root (d:\AntiGravity)
npm run install:all
```

*(Alternatively, run `npm install` inside the root, `backend/`, and `frontend/` folders).*

### 2. Running in Development Mode
Start both the Backend API (`http://localhost:5000`) and Frontend (`http://localhost:5173`) concurrently:

```bash
npm run dev
```

Open your browser at **`http://localhost:5173`**.

### 3. Automated Test Suites
TripWise includes two independent automated test suites:

```bash
# Run both test suites
npm test

# 1. Search Relevance & Quality Regression Suite (33 deterministic tests)
npm run test:relevance

# 2. End-to-End Backend Endpoint & Database Persistence Suite
npm run test:backend
```

The test suites verify:
- Relevance scoring and disambiguation for queries like *Rome*, *Rome Italy*, *Chennai*, *Paris*, *Colosseum*, and *Chai Chee*.
- Multiword destination queries and deliberate nonexistent destination handling.
- Rejection of Wikipedia disambiguation pages and substring matches.
- Neutral fallback images ensuring no iconic monument hijacking.
- All 8 category definitions including *Modern & Urban*.
- Full itinerary CRUD lifecycle (Add, Get, Update, Duplicate prevention, Delete) and zero database pollution.

### 4. Production Build
Build both frontend and backend bundles:

```bash
npm run build
```

---

## ☁️ Deployment Guide (Single Render Web Service)

TripWise is configured to run as a **single, unified service on Render**: Express serves the production React frontend static assets while handling all `/api` endpoints with zero routing conflicts.

### Render Web Service Settings

| Configuration Field | Recommended Setting | Note |
|---|---|---|
| **Environment** | `Node` | Node.js v22.5+ or v24 |
| **Root Directory** | `.` (Leave blank / repo root) | Full monorepo |
| **Build Command** | `npm run install:all && npm run build` | Installs deps and builds both frontend & backend |
| **Start Command** | `npm start` | Runs `node --experimental-sqlite dist/index.js` |
| **Auto-Deploy** | `Yes` (Triggered on push to `main`) | Deploys on git commit |

### Environment Variables

| Variable | Value / Purpose |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Set automatically by Render (defaults to `5000` locally) |
| `DATABASE_PATH` | `/var/data/tripwise.db` (when using a Persistent Disk) |

### ⚠️ Render Free Tier vs Persistent Disk Notice
- **Render Free Tier**: Render's free tier runs on an ephemeral filesystem without disk persistence. User-added itinerary items will persist while the instance is active, but will reset upon inactivity spin-down or new redeploys.
- **Render Paid Persistent Disk**: To retain user itinerary data permanently across redeployments and restarts, attach a **Persistent Disk** on Render mounted at `/var/data` (e.g., 1 GB) and set environment variable `DATABASE_PATH=/var/data/tripwise.db`. TripWise automatically verifies and creates the `/var/data` directory on startup.

---

## 📡 API Specification

All backend endpoints are prefixed with `/api`.

### Places Endpoints
- `GET /api/places`
  - Query parameters:
    - `query`: Search string (e.g. `Kyoto`, `Colosseum`, `Marina Beach`)
    - `category`: Filter by category (e.g. `Historical & Landmarks`, `Nature & Parks`)
    - `sort`: `recommended` | `rating-desc` | `name-asc` | `name-desc` | `category`
- `GET /api/places/categories`
  - Returns list of categories and current destination counts.
- `GET /api/places/:id`
  - Returns complete details for a single place.

### Itinerary Endpoints (SQLite Persistence)
- `GET /api/itinerary`
  - Retrieves all saved destinations ordered by creation time.
- `POST /api/itinerary`
  - Saves a destination to the itinerary.
  - Body: `{ placeId, name, location, category, imageUrl, description, lat, lng, notes, visitDate }`
- `PATCH /api/itinerary/:id`
  - Updates personal trip notes or planned visit date.
  - Body: `{ notes, visitDate }`
- `DELETE /api/itinerary/:id`
  - Removes a destination by numeric itinerary ID.
- `DELETE /api/itinerary/place/:placeId`
  - Removes a destination by its unique place ID.
- `DELETE /api/itinerary`
  - Clears all saved destinations.

### System & Health
- `GET /api/health`
  - Returns system status, DB connection health, and total saved places count.

---

## 🏛️ Database Architecture

TripWise utilizes SQLite with WAL (`Write-Ahead Logging`) mode for durability and speed:

```sql
CREATE TABLE IF NOT EXISTS itinerary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  lat REAL,
  lng REAL,
  notes TEXT DEFAULT '',
  visit_date TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_cache (
  cache_key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
```

---

## 🎨 Design System

- **Primary Forest Teal**: `#0F382C` — sophisticated and grounded.
- **Warm Terracotta/Amber**: `#D97706` — warm accent highlights.
- **Editorial Canvas Background**: `#FAF8F5` — soft, easy on the eyes.
- **Charcoal Typography**: `#1F2937` — high contrast, accessible reading.
- **Typography**: Editorial Serif headers (`Playfair Display` / System Serif) with clean geometric sans-serif body (`Plus Jakarta Sans`).

---

## 📋 Evaluation Checklist & Verification

| Requirement | Implementation Details | Status |
|---|---|---|
| **1. Discover destinations with real external API** | Integrated with OpenStreetMap Nominatim + Wikipedia REST API with live coordinates & summaries | ✅ Verified |
| **2. Search by name or keyword** | Instant search bar with debouncing and quick-filter pills | ✅ Verified |
| **3. Filter by category** | Category pills bar (Historical, Nature, Arts, Food, Coastal, Architecture, Modern & Urban) | ✅ Verified |
| **4. Sort by meaningful criteria** | Recommended, Rating (high to low), Name (A-Z), Name (Z-A), Category | ✅ Verified |
| **5. Destination details view** | Modal with photography, factual description, Google Maps & OSM links, coordinates | ✅ Verified |
| **6. Add destinations to itinerary** | One-click save toggle with instant toast feedback and optimistic state | ✅ Verified |
| **7. View and remove saved destinations** | "My Trip" view with removal, clear all, and inline date/notes editor | ✅ Verified |
| **8. Data persistence across restarts** | SQLite database (`backend/data/tripwise.db`) preserves all user data across restarts | ✅ Verified |
| **9. Loading, empty, and error feedback** | Pulsing skeleton cards, empty search state with reset CTA, recoverable error state | ✅ Verified |
| **10. Responsive desktop and mobile** | Fully responsive flexbox/grid layout, mobile bottom bar & navigation | ✅ Verified |

---

## 👨‍💻 Recruitment Submission Details

- **Candidate Submission**: Web Development Recruitment Task
- **Organization**: AWS Student Builder Group, VIT Chennai
- **Project Name**: TripWise — Smart Travel Planner
- **License**: MIT
