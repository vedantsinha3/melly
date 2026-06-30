# Melly

A Beli-style music ranking app. Log songs you've listened to, rank them through pairwise comparisons, and build a personal ordered list with computed scores.

## Stack

- **Expo (React Native)** — iOS + Android
- **Supabase** — Auth, Postgres, Row Level Security
- **Spotify Web API** — Track search, metadata, and top tracks import

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in `supabase/migrations/` via the SQL editor (`001_initial_schema.sql`, then `002_onboarding.sql`)
3. Enable **Spotify** auth provider — see [docs/spotify-oauth-setup.md](docs/spotify-oauth-setup.md)
4. (Optional) Deploy the Spotify search edge function:

```bash
supabase functions deploy spotify-search --no-verify-jwt
supabase secrets set SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=...
```

### 4. Set up Spotify

1. Create an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Copy Client ID and Secret into Supabase Spotify provider and `.env` (for search fallback)
3. Add redirect URIs — see [docs/spotify-oauth-setup.md](docs/spotify-oauth-setup.md)

### 5. Run the app

```bash
npx expo start --go
```

Scan the QR code with Expo Go.

## Onboarding import

New Spotify users with an empty ranked list are prompted to import their top tracks (~1 month or ~6 months) and rank each song through Melly's comparison flow.

## How ranking works

1. Search for a song on Spotify, or import top tracks on first login
2. Tap **Log** / **Start ranking** to begin
3. Compare the new song against songs already in your list (binary search)
4. Melly places it in your ranked list and assigns a score out of 10

No star ratings — your score is derived entirely from where the song lands in your personal ranking.
