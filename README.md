# TripWise — Smart Travel Planner

> **Full-Stack Web Development Recruitment Task**  
> AWS Student Builder Group · VIT Chennai

TripWise is a travel discovery and itinerary-planning web application. Explore curated destinations, search by city or keyword, filter and sort results, view destination information and geographic references, and save places to a personal itinerary with planned dates and notes.

**Live demo:** https://tripwise-vm4w.onrender.com  
**Source code:** https://github.com/shreyash-chauhan/TripWise  
**API health:** https://tripwise-vm4w.onrender.com/api/health

---

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [API reference](#api-reference)
- [Database](#database)
- [Deployment](#deployment)
- [Project requirements](#project-requirements)
- [Credits and license](#credits-and-license)

## Features

### Discover destinations
- Browse a curated collection of destinations with images, locations, categories, descriptions, and ratings.
- Search by destination name, city, landmark, or keyword.
- Use quick-search suggestions for destinations such as Kyoto, Paris, Rome, Bali, Cairo, Mahabalipuram, San Francisco, and Banff.
- Filter by category:
  - Historical & Landmarks
  - Nature & Parks
  - Arts & Culture
  - Food & Dining
  - Coastal & Beaches
  - Architecture
  - Modern & Urban
- Sort results by recommended order, rating, name (ascending or descending), or category.

### Explore destination details
- View a destination's description, location, and geographic coordinates.
- Open location references in Google Maps and OpenStreetMap.
- Follow Wikipedia references for additional information.
- Use fallback imagery and recoverable UI states when content is unavailable.

### Build a personal itinerary
- Add destinations to **My Trip** and remove them when plans change.
- Add an optional planned visit date and personal notes.
- Edit itinerary details and clear the itinerary.
- Export or print the itinerary.
- Receive visible feedback for actions, and use loading, empty, and error states to understand what the app is doing.

### Responsive interface
- Responsive layouts for desktop and mobile.
- Editorial visual style with forest-green accents, a warm off-white background, and clear typography.
- Mobile-friendly navigation, destination cards, and itinerary controls.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite 8, TypeScript |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite using Node's built-in `node:sqlite` |
| External data | OpenStreetMap Nominatim and Wikipedia REST API |
| Deployment | Render single web service |

## Architecture

TripWise is organized as a frontend and backend in one repository:

- **Frontend** — React application built with Vite. It calls the backend through `/api`.
- **Backend** — Express REST API. In production, it also serves the built frontend assets and the single-page application fallback.
- **Database** — SQLite stores itinerary records and related local data.
- **External sources** — OpenStreetMap Nominatim supports place/geographic lookup; Wikipedia provides destination summaries and reference information.

The production deployment uses one Render web service for both the frontend and API.

## Getting started

### Prerequisites

- Node.js 24 recommended (Node.js 22.5 or later is needed for the built-in SQLite module used by this project).
- npm.

### 1. Clone the repository

```bash
git clone https://github.com/shreyash-chauhan/TripWise.git
cd TripWise
```

### 2. Install dependencies

From the repository root:

```bash
npm run install:all
```

### 3. Run in development

```bash
npm run dev
```

The development frontend is available at `http://localhost:5173`. The backend runs at `http://localhost:5000` by default.

### 4. Build for production

```bash
npm run build
```

### 5. Run tests

Run both test suites:

```bash
npm test
```

Run an individual suite:

```bash
npm run test:relevance
npm run test:backend
```

The relevance tests cover search quality, disambiguation, category definitions, and handling of missing results. The backend tests cover API behavior and itinerary/database operations.

## Available scripts

Run these commands from the repository root:

| Command | Purpose |
|---|---|
| `npm run install:all` | Install root, backend, and frontend dependencies |
| `npm run dev` | Start frontend and backend in development |
| `npm run build` | Build the frontend and backend for production |
| `npm start` | Start the production server |
| `npm test` | Run the test suites |
| `npm run test:relevance` | Run search relevance regression tests |
| `npm run test:backend` | Run backend and persistence tests |

## API reference

All API routes are prefixed with `/api`.

### Places

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/places` | List destinations; supports search, category filtering, and sorting |
| `GET` | `/api/places/categories` | Return available categories and counts |
| `GET` | `/api/places/:id` | Retrieve details for a destination |

`GET /api/places` supports these query parameters:

| Parameter | Purpose |
|---|---|
| `query` | Search by name, city, landmark, or keyword |
| `category` | Filter by category |
| `sort` | `recommended`, `rating-desc`, `name-asc`, `name-desc`, or `category` |

### Itinerary

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/itinerary` | Retrieve saved itinerary entries |
| `POST` | `/api/itinerary` | Add a destination to the itinerary |
| `PATCH` | `/api/itinerary/:id` | Update itinerary notes or visit date |
| `DELETE` | `/api/itinerary/:id` | Remove an entry by itinerary ID |
| `DELETE` | `/api/itinerary/place/:placeId` | Remove an entry by destination ID |
| `DELETE` | `/api/itinerary` | Clear all itinerary entries |

The `POST /api/itinerary` request body accepts destination information such as `placeId`, `name`, `location`, `category`, `imageUrl`, `description`, `lat`, `lng`, `notes`, and `visitDate`.

The `PATCH /api/itinerary/:id` request body can include `notes` and `visitDate`.

### Health

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Report API status, database connectivity, environment, and saved itinerary count |

Try the deployed health endpoint: https://tripwise-vm4w.onrender.com/api/health

## Database

TripWise uses SQLite through Node's built-in `node:sqlite` module. The database layer supports a configurable `DATABASE_PATH`; otherwise, it uses the project's default database location.

The itinerary data model includes fields for the destination ID, name, location, category, image URL, description, coordinates, notes, visit date, and created/updated timestamps. A local API cache table is also used where applicable.

### Important: persistence on Render

The live demo currently runs on Render. **The local SQLite file is not guaranteed to survive instance replacement, redeployment, or free-service spin-down when stored on an ephemeral filesystem.** For durable production persistence, attach a Render Persistent Disk and set `DATABASE_PATH` to a path on that mounted disk (for example, `/var/data/tripwise.db` when the disk is mounted at `/var/data`).

## Deployment

TripWise is configured for a single Render web service that builds the frontend and backend, then lets Express serve the frontend and API.

Suggested Render settings:

| Setting | Value |
|---|---|
| Environment | Node |
| Root directory | Repository root |
| Build command | `npm run install:all && npm run build` |
| Start command | `npm start` |
| `NODE_ENV` | `production` |

Render supplies the `PORT` environment variable. For persistent SQLite storage, configure `DATABASE_PATH` to a location on a mounted persistent disk.

## Project requirements

The project was built to demonstrate:

- Integration with external place and information APIs.
- Search, filtering, and sorting.
- Destination detail views.
- Itinerary create, read, update, and delete operations.
- Database-backed itinerary storage.
- Loading, empty, and error states.
- Responsive desktop and mobile UI.
- A public source repository and live deployment.

## Credits and license

- Geographic/place data: [OpenStreetMap](https://www.openstreetmap.org/) and [Nominatim](https://nominatim.org/).
- Destination summaries and references: [Wikipedia](https://www.wikipedia.org/).
- Map links: [Google Maps](https://maps.google.com/) and OpenStreetMap.

**License:** MIT, as intended for this project. If you distribute the repository, make sure the repository includes the corresponding `LICENSE` file.
