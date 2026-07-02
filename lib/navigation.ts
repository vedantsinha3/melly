import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';

export function openCompareFlow(
  router: ReturnType<typeof useRouter>,
  trackId: string,
  options?: { albumKey?: string },
) {
  const params = new URLSearchParams({ ts: String(Date.now()) });
  if (options?.albumKey) {
    params.set('albumKey', options.albumKey);
  }
  router.push(`/compare/${trackId}?${params.toString()}`);
}

export function goBackOrFallback(
  router: ReturnType<typeof useRouter>,
  fallbackHref: Href = '/(tabs)',
) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallbackHref);
}
