# Melly

A Beli-style music ranking app. Log songs you've listened to, rank them through pairwise comparisons, and build a personal ordered list with computed scores.

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

If Spotify login fails, see [docs/spotify-oauth-setup.md](docs/spotify-oauth-setup.md) for redirect URL and email-confirmation troubleshooting.

## Stack

- **Expo (React Native)** — iOS, Android, and web from one codebase
- **Supabase** — Auth, Postgres, Row Level Security
- **Spotify Web API** — Track search, metadata, personalized recommendations, and top-tracks import

## How ranking works

1. Pick a song from your Spotify feed on **Log song**, search manually, or import top tracks on first login
2. Tap **Rank** to start the comparison flow
3. Choose which song deserves the higher spot — Melly uses binary search against your existing list
4. Your score (out of 10) is derived from where the song lands in your personal ranking

No star ratings — placement in your list *is* the rating.

## Optional: Spotify search edge function

Track search works out of the box using client credentials in `.env`. You can optionally deploy a Supabase edge function instead:

```bash
supabase functions deploy spotify-search --no-verify-jwt
supabase secrets set SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=...
```

The app tries client credentials first and falls back to the edge function if needed.

## Project structure

```
app/                  # Expo Router screens
  (auth)/             # Login
  (tabs)/             # Dashboard + Log song
  compare/            # Pairwise ranking flow
  onboarding/         # First-time Spotify import
components/           # UI and feature components
contexts/             # Auth and import queue state
lib/                  # Supabase, Spotify, ranking logic
supabase/migrations/  # Database schema
docs/                 # Setup guides
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

**TypeScript / build issues after pulling**
- Run `npm install` again, then `npx expo start -c`

## License

See [LICENSE](LICENSE).
