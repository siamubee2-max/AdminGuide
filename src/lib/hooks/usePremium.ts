import { useQuery } from '@tanstack/react-query';
import { hasEntitlement } from '@/lib/revenuecatClient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

/**
 * Hook to check premium status and gate features.
 * Returns isPremium boolean and a requirePremium() function
 * that redirects to paywall if not subscribed.
 */
export function usePremium() {
  const router = useRouter();

  const { data: isPremium, isLoading } = useQuery({
    queryKey: ['premium-status'],
    queryFn: async () => {
      const result = await hasEntitlement('premium');
      return result.ok ? result.data : false;
    },
    staleTime: 30_000, // Cache for 30 seconds
  });

  /**
   * Call this before performing a premium action.
   * Returns true if the user has premium, false otherwise (and navigates to paywall).
   */
  const requirePremium = useCallback((): boolean => {
    if (isPremium) return true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/premium');
    return false;
  }, [isPremium, router]);

  return {
    isPremium: isPremium ?? false,
    isLoading: isLoading,
    requirePremium,
  };
}
