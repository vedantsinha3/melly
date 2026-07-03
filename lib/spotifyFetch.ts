const SPOTIFY_API_ORIGIN = 'https://api.spotify.com/v1';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function spotifyFetch(accessToken: string, url: string): Promise<Response> {
  let delayMs = 1000;

  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status !== 429) return response;
    if (attempt === 3) return response;

    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : delayMs;
    await sleep(Number.isFinite(retryAfterMs) && retryAfterMs > 0 ? retryAfterMs : delayMs);
    delayMs = Math.min(delayMs * 2, 8000);
  }

  throw new Error('Spotify request failed');
}

export async function spotifyGetJson<T>(accessToken: string, path: string): Promise<T> {
  const url = path.startsWith('http') ? path : `${SPOTIFY_API_ORIGIN}${path}`;
  const response = await spotifyFetch(accessToken, url);

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 429) {
      throw new Error('Spotify is rate limiting requests. Try again in a moment.');
    }
    throw new Error(`Spotify API failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}
