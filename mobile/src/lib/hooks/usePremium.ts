import { useQuery } from '@tanstack/react-query';
import { hasEntitlement } from '@/lib/revenuecatClient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import type { PlanTier } from '@/lib/state/usage-store';
import { canAccessFeature } from '@/lib/state/usage-store';

/**
 * Hook to check premium status and gate features.
 * Returns the current plan tier and gating functions.
 */
export function usePremium() {
  const router = useRouter();

  const { data: tier, isLoading } = useQuery({
    queryKey: ['premium-tier'],
    queryFn: async (): Promise<PlanTier> => {
      const familyResult = await hasEntitlement('family');
      if (familyResult.ok && familyResult.data) return 'family';

      const essentialResult = await hasEntitlement('premium');
      if (essentialResult.ok && essentialResult.data) return 'essential';

      return 'free';
    },
    staleTime: 30_000,
  });

  const currentTier: PlanTier = tier ?? 'free';
  const isPremium = currentTier !== 'free';
  const isFamily = currentTier === 'family';

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

  /**
   * Call this before performing a family-only action.
   * Returns true if the user has family plan, false otherwise (navigates to paywall).
   */
  const requireFamily = useCallback((): boolean => {
    if (isFamily) return true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/premium');
    return false;
  }, [isFamily, router]);

  /**
   * Check if a specific feature is available for the current tier.
   */
  const hasFeature = useCallback(
    (feature: string): boolean => canAccessFeature(feature, currentTier),
    [currentTier]
  );

  /**
   * Gate a feature: returns true if accessible, redirects to paywall if not.
   */
  const requireFeature = useCallback(
    (feature: string): boolean => {
      if (canAccessFeature(feature, currentTier)) return true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/premium');
      return false;
    },
    [currentTier, router]
  );

  return {
    tier: currentTier,
    isPremium,
    isFamily,
    isLoading,
    requirePremium,
    requireFamily,
    hasFeature,
    requireFeature,
  };
}
