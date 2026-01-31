import React, { useState, memo, useEffect } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, ViewStyle, TextStyle } from 'react-native';
import Theme from '@/styles/theme';

interface CoinIconProps {
  uri?: string | null;
  symbol: string;
  size?: number;
  style?: ViewStyle;
}

// Global cache for loaded images - persists across re-renders
const imageCache = new Map<string, boolean>();

/**
 * CoinIcon component that displays a cryptocurrency icon with fallback.
 * STATIC - does not re-render when parent updates.
 * Images are cached and won't reload/jitter on price updates.
 */
function CoinIconComponent({ uri, symbol, size = 44, style }: CoinIconProps) {
  // Check cache first
  const cacheKey = uri || symbol;
  const wasCached = imageCache.get(cacheKey);

  const [hasError, setHasError] = useState(wasCached === false);
  const [isLoaded, setIsLoaded] = useState(wasCached === true);

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: 'hidden',
    ...style,
  };

  const imageStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const placeholderStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
  };

  const textStyle: TextStyle = {
    color: Theme.colors.white,
    fontSize: size * 0.45,
    fontWeight: '700',
  };

  // No URI or known error - show placeholder only
  if (!uri || hasError) {
    return (
      <View style={[containerStyle, { backgroundColor: Theme.colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={textStyle}>
          {symbol?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {/* Placeholder shown until image loads */}
      {!isLoaded && (
        <View style={placeholderStyle}>
          <Text style={textStyle}>
            {symbol?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
      )}
      <Image
        source={{ uri, cache: 'force-cache' }}
        style={[imageStyle, !isLoaded && { opacity: 0 }]}
        onError={() => {
          imageCache.set(cacheKey, false);
          setHasError(true);
        }}
        onLoad={() => {
          imageCache.set(cacheKey, true);
          setIsLoaded(true);
        }}
        resizeMode="cover"
        fadeDuration={0}
      />
    </View>
  );
}

// Strict memoization - NEVER re-render unless symbol changes
const CoinIcon = memo(CoinIconComponent, (prev, next) => {
  // Return true to prevent re-render (props are equal)
  return prev.symbol === next.symbol && prev.size === next.size;
});

export default CoinIcon;
