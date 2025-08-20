# Setup Instructions

## 1. Install Dependencies

```bash
cd website-react
npm install
```

## 2. Configure Environment Variables

Update `.env.local` with your actual Supabase credentials:

```env
VITE_JOBS_URL=https://leohickstein.github.io/canada-job-tracker/data/jobs.json

# Replace with your actual Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: For client-side testing (move to backend later)
VITE_ADZUNA_APP_ID=your_app_id
VITE_ADZUNA_APP_KEY=your_app_key
```

## 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Run the SQL schema from `../supabase/schema.sql` in the SQL Editor
3. Copy your project URL and anon key to `.env.local`

## 4. GitHub Secrets (for backend job fetching)

Add these secrets to your GitHub repository:

- `SUPABASE_URL`: Your project URL  
- `SUPABASE_SERVICE_KEY`: Service role key (from Supabase Settings → API)

## 5. Run the App

```bash
npm run dev
```

## What's Implemented

✅ **Multi-user authentication** with Supabase  
✅ **Smart job caching** system  
✅ **Provider adapter pattern** for multiple job sources  
✅ **Graceful fallback** to static data for anonymous users  
✅ **Updated UI** with sign in/out functionality  

## How It Works

1. **Anonymous users**: See static job data (current behavior)
2. **Authenticated users**: Get personalized job data from cache
3. **Stale data**: Automatically queued for refresh in background
4. **New users**: Start with static data while cache builds

## Next Steps

1. Set up Supabase project and update environment variables
2. Test authentication flow
3. Add user job interests management UI
4. Implement backend job fetching service for cache population