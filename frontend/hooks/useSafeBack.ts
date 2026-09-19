import { useRouter } from 'expo-router';

/**
 * Like router.back(), but falls back to replacing with `fallback` when there's
 * no history to pop to (e.g. the screen was opened directly via a deep link
 * or a hard page reload) — router.back() in that case fires an unhandled
 * GO_BACK action and does nothing.
 */
export function useSafeBack(fallback: '/(tabs)/home' = '/(tabs)/home') {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback);
    }
  };
}
