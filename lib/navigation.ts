import { useRouter } from 'expo-router';

export function openCompareFlow(router: ReturnType<typeof useRouter>, trackId: string) {
  router.push(`/compare/${trackId}?ts=${Date.now()}`);
}
