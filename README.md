# Urbanist Map

A minimal web app for tracking cities on an interactive map. Built with Next.js 14, TypeScript, and Mapbox GL JS.

## Features

- 🗺️ Interactive map with Mapbox GL JS
- 🏙️ Add cities with categories (Tier 1, Tier 2, Tier 3)
- 🔍 City search with Mapbox Geocoding API
- 🎨 Color-coded markers by category
- 📸 City photos from Wikimedia Commons
- 💾 Data persistence with localStorage
- 🎯 Filter cities by category

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Mapbox token:**
   - Get a free Mapbox token from [mapbox.com](https://account.mapbox.com/)
   - Copy `.env.local.example` to `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```
   - Add your Mapbox token to `.env.local`:
     ```
     NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
     ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Add a city:**
   - Type a city name in the search box
   - Select a category from the dropdown
   - Click on a search result to add it to your map

2. **Filter cities:**
   - Use the filter dropdown to show all cities or filter by category

3. **View city details:**
   - Click on a city in the list or a marker on the map
   - The map will fly to the city location
   - Photos from Wikimedia Commons will appear below the city list

4. **Delete a city:**
   - Click the "Delete" button on any city card

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Mapbox GL JS** - Interactive maps
- **Mapbox Geocoding API** - City search
- **Wikimedia Commons API** - City photos
- **localStorage** - Data persistence

## Project Structure

```
├── app/
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main page
├── components/
│   ├── MapView.tsx      # Map component
│   ├── Sidebar.tsx      # Sidebar with city list
│   └── PhotoStrip.tsx   # City photos display
├── lib/
│   ├── storage.ts       # localStorage utilities
│   ├── mapbox.ts        # Mapbox geocoding
│   └── wikimedia.ts     # Wikimedia photo fetching
└── types.ts            # TypeScript types
```

## Notes

- All data is stored in browser localStorage
- No backend or database required
- Photos are cached for 7 days
- No authentication - data is local to your browser

## Deploy to Production & Install on Phone

See [DEPLOY.md](./DEPLOY.md) for step-by-step instructions to:
- Push to GitHub
- Deploy to Vercel (free)
- Install as PWA on your phone

**Quick steps:**
1. Push code to GitHub
2. Deploy to Vercel (connects to GitHub automatically)
3. Add environment variables in Vercel
4. Create app icons (192x192 and 512x512 PNG files in `public/`)
5. Install on phone from the Vercel URL

