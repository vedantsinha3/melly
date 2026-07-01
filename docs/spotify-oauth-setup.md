# Spotify OAuth setup for Melly

Required for **Sign in with Spotify** and **top tracks import**.

## Spotify Developer Dashboard

1. Open [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → your app
2. **Redirect URIs** — add only:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Do **not** add `melly://` here (Spotify rejects it; Supabase handles the redirect back to the app)
3. **User Management** — if the app is in Development Mode, add each test user's Spotify email to the allowlist (max 25 users)

## Supabase Dashboard

1. **Authentication → Providers → Spotify**
   - Enable Spotify
   - Paste Client ID and Client Secret from Spotify
2. **Authentication → URL Configuration → Redirect URLs** — add all that apply:
   - `melly://**` (dev/production builds)
   - `exp://127.0.0.1:8081/**` (Expo Go on simulator)
   - `exp://192.168.*.*:8081/**` if supported, or add your exact Expo Go URL from the Metro terminal (e.g. `exp://192.168.1.233:8081/**`)
   - `http://localhost:8081/**` (web dev)
   - `http://127.0.0.1:8081/**` (web dev)
3. Run migration [`supabase/migrations/002_onboarding.sql`](../supabase/migrations/002_onboarding.sql) in the SQL editor

## Scopes used

- `user-top-read` — top tracks and on-repeat picks
- `user-read-email` — user profile in Supabase
- `user-read-recently-played` — recently played carousel on Log Song
- `user-library-read` — liked and recently added tracks
- `playlist-read-private` — Discover Weekly and Release Radar

## Verify

1. Restart Expo: `npx expo start -c --go`
2. Tap **Continue with Spotify** on the login screen
3. After login, you should land on the import onboarding screen (if your ranked list is empty)

## Spotify email confirmation

If Supabase logs show `422: Unverified email with spotify`, the first Spotify login still needs email confirmation before Supabase will create the session.

1. Complete Spotify sign-in in the browser
2. Check the email address on your Spotify account for a confirmation email from Supabase
3. Click the confirmation link
4. Sign in with Spotify again

If no email arrives, check spam/junk and Supabase Auth email delivery settings. For local development, you can temporarily disable email confirmations in Supabase Auth settings to unblock testing.
