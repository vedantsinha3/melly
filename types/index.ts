export type Track = {
  spotify_id: string;
  name: string;
  artist_names: string[];
  album_name: string;
  album_art_url: string | null;
  album_id?: string | null;
  album_type?: string | null;
  album_release_date?: string | null;
  album_total_tracks?: number | null;
  track_number?: number | null;
  duration_ms: number;
  preview_url: string | null;
  genre: string | null;
};

export type Rating = {
  id: string;
  user_id: string;
  track_id: string;
  rank_position: number;
  score: number;
  notes: string | null;
  listened_at: string;
  created_at: string;
};

export type RatingWithTrack = Rating & {
  track: Track;
};

export type SpotifySearchTrack = {
  id: string;
  name: string;
  track_number?: number;
  artists: { name: string }[];
  album: {
    id?: string;
    name: string;
    album_type?: string;
    release_date?: string;
    total_tracks?: number;
    images: { url: string }[];
  };
  duration_ms: number;
  preview_url: string | null;
};

export type SpotifyAlbumTrack = {
  id: string;
  name: string;
  track_number: number;
  duration_ms: number;
};

export type TopTracksTimeRange = 'short_term' | 'medium_term';

export type ComparisonSession = {
  newTrack: Track;
  rankedList: RatingWithTrack[];
  low: number;
  high: number;
  comparisonsMade: number;
};
