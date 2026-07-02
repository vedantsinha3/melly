import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';

export function openCompareFlow(router: ReturnType<typeof useRouter>, trackId: string) {
  router.push(`/compare/${trackId}?ts=${Date.now()}`);
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
