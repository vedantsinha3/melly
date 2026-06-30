import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Spotify auth failed');
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: 'Spotify not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query } = await req.json();
    if (!query?.trim()) {
      return new Response(JSON.stringify({ tracks: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = await getToken(clientId, clientSecret);
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query.trim())}&type=track`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!searchResponse.ok) {
      throw new Error('Spotify search failed');
    }

    const searchData = await searchResponse.json();

    return new Response(JSON.stringify({ tracks: searchData.tracks.items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
