import { useMemo } from 'react';
import { useWindowDimensions, Platform } from 'react-native';

export type DeviceType = 'phone' | 'tablet';

interface DeviceInfo {
  deviceType: DeviceType;
  isTablet: boolean;
  isPhone: boolean;
  screenWidth: number;
  screenHeight: number;
  isLandscape: boolean;
  // Responsive breakpoints
  columns: number;
  sidePadding: number;
  maxContentWidth: number;
}

/**
 * Hook that returns the device type and responsive layout information.
 * Uses screen dimensions to determine if the device is a phone or tablet.
 *
 * Tablet detection criteria:
 * - Screen width >= 768px in portrait mode
 * - Or smallest dimension >= 600px (common tablet threshold)
 */
export function useDeviceType(): DeviceInfo {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isLandscape = width > height;
    const shortestSide = Math.min(width, height);
    const longestSide = Math.max(width, height);

    // Tablet detection logic
    // iPads have shortest side of ~768px or more
    // Android tablets typically have shortest side of ~600px or more
    const isTablet = shortestSide >= 600 || (shortestSide >= 550 && longestSide >= 800);

    const deviceType: DeviceType = isTablet ? 'tablet' : 'phone';

    // Calculate responsive values based on device type
    let columns = 1;
    let sidePadding = 24;
    let maxContentWidth = width;

    if (isTablet) {
      if (isLandscape) {
        columns = 2;
        sidePadding = 48;
        maxContentWidth = Math.min(width - 96, 1200);
      } else {
        columns = 2;
        sidePadding = 40;
        maxContentWidth = Math.min(width - 80, 800);
      }
    } else {
      // Phone in landscape
      if (isLandscape && width > 600) {
        columns = 2;
        sidePadding = 32;
      }
    }

    return {
      deviceType,
      isTablet,
      isPhone: !isTablet,
      screenWidth: width,
      screenHeight: height,
      isLandscape,
      columns,
      sidePadding,
      maxContentWidth,
    };
  }, [width, height]);
}

/**
 * Helper to get responsive styles based on device type
 */
export function getResponsiveValue<T>(
  device: DeviceInfo,
  phoneValue: T,
  tabletValue: T
): T {
  return device.isTablet ? tabletValue : phoneValue;
}

/**
 * Helper to get conditional layout style
 */
export function getTabletLayoutStyle(device: DeviceInfo) {
  if (!device.isTablet) {
    return {};
  }

  return {
    flexDirection: 'row' as const,
    gap: 24,
  };
}

/**
 * Get card width for grid layouts
 */
export function getCardWidth(device: DeviceInfo, cardsPerRow: number = 2): number {
  if (device.isTablet && device.isLandscape) {
    return (device.screenWidth - device.sidePadding * 2 - (cardsPerRow - 1) * 16) / cardsPerRow;
  }
  if (device.isTablet) {
    return (device.screenWidth - device.sidePadding * 2 - 16) / 2;
  }
  return device.screenWidth - device.sidePadding * 2;
}
