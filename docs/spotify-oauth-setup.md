# Spotify OAuth setup for Melly

Required for **Sign in with Spotify** and **top tracks import**.

## Spotify Developer Dashboard

1. Open [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → your app
2. **Redirect URIs** — add both:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - `melly://`
3. **User Management** — if the app is in Development Mode, add each test user's Spotify email to the allowlist (max 25 users)

## Supabase Dashboard

1. **Authentication → Providers → Spotify**
   - Enable Spotify
   - Paste Client ID and Client Secret from Spotify
2. **Authentication → URL Configuration**
   - Redirect URLs: add `melly://**` and `exp://127.0.0.1:8081/**` (Expo Go dev)
3. Run migration [`supabase/migrations/002_onboarding.sql`](../supabase/migrations/002_onboarding.sql) in the SQL editor

## Scopes used

- `user-top-read` — fetch top tracks for onboarding import
- `user-read-email` — user profile in Supabase

## Verify

1. Restart Expo: `npx expo start -c --go`
2. Tap **Continue with Spotify** on the login screen
3. After login, you should land on the import onboarding screen (if your ranked list is empty)
