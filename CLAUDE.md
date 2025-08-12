# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a Canada Job Tracker application with two main components:
- **Root level**: Build scripts and shared configuration
- **website-react/**: Main React application using Vite, TypeScript, and Tailwind CSS

The project uses a dual deployment model where the React app builds to `dist/` and gets copied to a parallel `website/` directory for GitHub Pages hosting.

## Common Commands

### Development
```bash
cd website-react
npm install
npm run dev                    # Start Vite dev server
```

### Building & Deployment
```bash
cd website-react
npm run build                  # Build React app to dist/
npm run build:to-website       # Copy dist/* to ../website/ for Pages deployment
npm run preview                # Preview built app locally
```

### Environment Setup
The app supports remote job data loading via environment variable:
```bash
echo "VITE_JOBS_URL=https://leohickstein.github.io/canada-job-tracker/data/jobs.json" > .env.local
```

## Architecture Overview

### Frontend Architecture (website-react/)
- **SOLID-style folder organization**: types, utils, services, hooks, ui/components, ui/pages
- **State Management**: 
  - `usePersist` hook manages localStorage for job status/tracking
  - `useJobs` hook handles job data fetching and error states
  - Local state for filters, view routing, and UI
- **Routing**: Simple state-based routing with 4 views: search, tracker, saved, alerts
- **Data Flow**: Jobs fetched via `jobsService` → filtered/processed in components → status persisted via `storageService`

### Key Features
- **Drag & Drop Kanban**: Uses @dnd-kit for job status tracking with 5 columns (backlog, applied, interview, offer, rejected)
- **Theme System**: Light/Dark/System theme with localStorage persistence and `<html class="dark">` toggling
- **Base URL Awareness**: Works at `/` in dev and `/canada-job-tracker/` on GitHub Pages
- **Data Deduplication**: Robust job deduplication by ID and composite keys (company|title|location)
- **Export Functionality**: CSV export of tracked jobs

### Component Structure
- **App.tsx**: Main app component with view routing and state coordination
- **Pages**: SearchPage (filtering), TrackerPage (kanban), SavedPage, AlertsPage
- **Components**: JobCard, FiltersPanel, Header, TrackerBoard, StatusBadge, ResultsBar
- **Services**: jobsService (data fetching), storageService (localStorage persistence)
- **Types**: Centralized in job.ts with Job, Status, Persist, ColumnKey, PersistState types

### Data Models
- **Job**: Core job data (id, title, company, location, url, salary, etc.)
- **Persist**: User interaction state (status, notes, clickedAt, appliedAt, tracked)
- **PersistState**: Complete persistence state (items, boardOrder, version)

### Build System
- **Vite + TypeScript**: Modern build tooling with TypeScript support
- **Tailwind CSS**: Utility-first CSS with glass morphism utilities
- **Custom Scripts**: `copyDist.mjs` handles deployment copying from dist to website folder

## Development Notes

- The app expects job data in `public/data/jobs.json` format: `{ jobs: Job[] }`
- localStorage keys: `jobtracker-persist` (user state), `jobtracker-theme` (theme preference)
- Glass UI utilities are custom CSS classes for iOS-style glass morphism effects
- Error handling includes raw JSON sample display for debugging data issues
- All job IDs are deduplicated and tracked through the persistence system