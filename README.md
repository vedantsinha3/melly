# Melly

A Beli-style music ranking app. Log songs you've listened to, rank them through pairwise comparisons, and build a personal ordered list with computed scores — then explore your taste at the album and artist level.

## What you'll need

Before cloning, create accounts and install tooling on your machine:

| Requirement | Notes |
|-------------|--------|
| **Node.js 20+** | [nodejs.org](https://nodejs.org) — LTS recommended |
| **npm** | Ships with Node |
| **Git** | To clone the repo |
| **Supabase project** | Free tier is fine — [supabase.com](https://supabase.com) |
| **Spotify Developer app** | [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) |
| **Expo Go** (optional) | iOS/Android app for testing on a physical device |

To run on simulators instead of a phone:

- **iOS** — Xcode (macOS only)
- **Android** — Android Studio + emulator
- **Web** — any modern browser (no extra install)

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/<your-org>/melly.git
cd melly
npm install
```

### 2. Configure environment variables

`.env` is not committed to the repo. Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Where to find it |
|----------|------------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key |
| `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` | Spotify Developer Dashboard → your app → Client ID |
| `EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET` | Spotify Developer Dashboard → your app → Client Secret |

The Spotify client credentials power track search. OAuth sign-in is configured separately in the Supabase dashboard (see below).

Restart Expo after changing `.env`:

```bash
npx expo start -c
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the migrations **in order**:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_onboarding.sql`
   - `supabase/migrations/002_tracks_album_metadata.sql`
   - `supabase/migrations/003_tracks_update_metadata.sql`
3. Enable auth providers you want to use:
   - **Email** — enabled by default
   - **Spotify** — required for Spotify login, top-tracks import, and the Log Song feed — see [docs/spotify-oauth-setup.md](docs/spotify-oauth-setup.md)
   - **Apple** — optional; only works on iOS builds with Apple Sign-In configured

### 4. Set up Spotify

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Add this **Redirect URI** (replace with your Supabase project ref):

   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

   Do **not** add `melly://` here — Spotify rejects custom schemes; Supabase handles the redirect back to the app.

3. If your Spotify app is in **Development Mode**, add your Spotify account email under **User Management** (max 25 users).
4. Paste the Client ID and Client Secret into **Supabase → Authentication → Providers → Spotify**.
5. Configure Supabase redirect URLs for your dev environment — full details in [docs/spotify-oauth-setup.md](docs/spotify-oauth-setup.md).

### 5. Run the app

```bash
npx expo start
```

Then choose how to open it:

| Platform | Command / action |
|----------|------------------|
| **Expo Go (phone)** | Scan the QR code with the Expo Go app |
| **iOS Simulator** | Press `i` in the terminal (macOS + Xcode required) |
| **Android Emulator** | Press `a` in the terminal |
| **Web** | Press `w`, or run `npm run web` |

Useful scripts from `package.json`:

```bash
npm start          # expo start
npm run ios        # expo start --ios
npm run android    # expo start --android
npm run web        # expo start --web
```

### 6. Verify everything works

1. Open the app — you should land on the login screen.
2. Tap **Continue with Spotify** and complete sign-in.
3. If your ranked list is empty, you'll see the onboarding import flow.
4. After setup, the **Log song** tab should show Spotify recommendations (recently played, liked, etc.).
5. Tap a song to start ranking — compare it against songs already in your list.
6. Visit **Albums** to see your collection build as you rank more tracks from the same release.

If Spotify login fails, see [docs/spotify-oauth-setup.md](docs/spotify-oauth-setup.md) for redirect URL and email-confirmation troubleshooting.

## Stack

- **Expo (React Native)** — iOS, Android, and web from one codebase
- **Supabase** — Auth, Postgres, Row Level Security
- **Spotify Web API** — Track search, metadata, album tracklists, personalized recommendations, and top-tracks import

## App overview

| Tab / screen | What it does |
|--------------|--------------|
| **Dashboard** | Taste profile, score distribution, recent activity, and artist highlights |
| **Log song** | Spotify feed, library search, and manual track lookup to start ranking |
| **Library** | Your full ranked song list, ordered by score |
| **Albums** | Album and EP collection — favorites, in-progress releases, and collection stats |
| **Song detail** | Score, neighbors in your ranking, notes, and links to album/artist |
| **Album detail** | Artwork-led tracklist, rank-next flow, completion progress |
| **Artist detail** | Discography, top songs, and album breakdown |
| **Compare** | Pairwise ranking flow (binary search placement) |

On wide screens (web / tablet), a sidebar replaces the bottom tab bar.

## How ranking works

1. Pick a song from your Spotify feed on **Log song**, search your library or Spotify, or import top tracks on first login
2. Tap **Rank** to start the comparison flow
3. Choose which song deserves the higher spot — Melly uses binary search against your existing list
4. Your score (out of 10) is derived from where the song lands in your personal ranking

No star ratings — placement in your list *is* the rating.

## Album collection

As you rank songs, Melly groups them into albums and EPs (single-track releases are excluded from the catalog).

**Favorite albums** are releases you've meaningfully explored — ranked with enough depth to trust the average. **Exploring** albums are still in progress.

The **Albums** tab is organized around your collection:

1. **Favorite album hero** — artwork, title, artist, average score, confidence, and completion status
2. **Collection stats** — completed count, in-progress count, average rating, hours ranked
3. **Continue your album** — quick path back to the release you're working through
4. **Favorite albums grid** — top picks with confidence badges and progress

Album scores use a **confidence-adjusted** ranking: albums with more ranked tracks are weighted more heavily, and completed albums get a small boost. Each album detail page shows a unified tracklist so you can rank the next song or finish what you started.

## Optional: Spotify search edge function

Track search works out of the box using client credentials in `.env`. You can optionally deploy a Supabase edge function instead:

```bash
supabase functions deploy spotify-search --no-verify-jwt
supabase secrets set SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=...
```

The app tries client credentials first and falls back to the edge function if needed.

## Project structure

```
app/                      # Expo Router screens
  (auth)/                 # Login
  (tabs)/                 # Dashboard, Log song, Library, Albums
  album/                  # Album detail
  artist/                 # Artist detail
  song/                   # Song detail
  compare/                # Pairwise ranking flow
  onboarding/             # First-time Spotify import
components/
  album/                  # Collection hero, favorite/exploring cards
  artist/                 # Artist detail sections
  dashboard/              # Dashboard widgets
  log-song/               # Search and Spotify feed
  song/                   # Song detail sections
  ui/                     # Shared primitives (Button, Card, Text, …)
contexts/                 # Auth and import queue state
lib/                      # Supabase, Spotify, ranking, albums, dashboard
supabase/migrations/      # Database schema
docs/                     # Setup guides
```

## Troubleshooting

**App shows login but sign-in does nothing**
- Confirm `.env` values are set and you've restarted Expo with `-c`
- Check Supabase Auth logs for errors

**Spotify login redirects but session isn't created**
- Add the correct redirect URLs in Supabase (see [docs/spotify-oauth-setup.md](docs/spotify-oauth-setup.md))
- If you see `Unverified email with spotify`, confirm your email via the Supabase message, then sign in again

**Log song feed is empty**
- Sign out and sign in again after updating OAuth scopes (existing sessions may lack permissions)
- Ensure your Spotify account is on the app's allowlist (Development Mode)

**Search returns an error**
- Verify `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` and `EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET` in `.env`

**Album tracklists fail to load / Spotify 429 errors**
- The app caches Spotify responses and retries with `Retry-After` — wait a moment and reload
- Heavy browsing can hit Spotify rate limits in Development Mode

**Ranking or album pages error after pulling latest**
- Run the newer migrations (`002_tracks_album_metadata.sql`, `003_tracks_update_metadata.sql`) if you haven't already

**TypeScript / build issues after pulling**
- Run `npm install` again, then `npx expo start -c`

## License

See [LICENSE](LICENSE).
