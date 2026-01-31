import React, { useState, useRef, memo } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, ViewStyle, TextStyle } from 'react-native';
import Theme from '@/styles/theme';

interface CoinIconProps {
  uri?: string | null;
  symbol: string;
  size?: number;
  style?: ViewStyle;
}

// Cache loaded images to prevent re-loading on re-renders
const loadedImages = new Set<string>();

/**
 * CoinIcon component that displays a cryptocurrency icon with fallback.
 * When the image fails to load (CORS, network, etc.), it shows a placeholder
 * with the first letter of the symbol.
 * Memoized to prevent unnecessary re-renders when prices update.
 */
function CoinIconComponent({ uri, symbol, size = 44, style }: CoinIconProps) {
  // Check if this image was already loaded
  const alreadyLoaded = uri ? loadedImages.has(uri) : false;
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!alreadyLoaded);

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    ...style,
  };

  const imageStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const placeholderStyle: ViewStyle = {
    ...containerStyle,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const textStyle: TextStyle = {
    color: Theme.colors.white,
    fontSize: size * 0.45,
    fontWeight: '700',
  };

  // Show placeholder if no URI, error occurred, or still loading (show both)
  const showPlaceholder = !uri || hasError;

  if (showPlaceholder) {
    return (
      <View style={placeholderStyle}>
        <Text style={textStyle}>
          {symbol?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {/* Show placeholder while loading */}
      {isLoading && (
        <View style={[placeholderStyle, StyleSheet.absoluteFill]}>
          <Text style={textStyle}>
            {symbol?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
      )}
      <Image
        source={{ uri }}
        style={imageStyle}
        onError={() => {
          console.log(`[CoinIcon] Failed to load image for ${symbol}: ${uri}`);
          setHasError(true);
        }}
        onLoad={() => {
          if (uri) loadedImages.add(uri);
          setIsLoading(false);
        }}
        resizeMode="cover"
      />
    </View>
  );
}

// Memoize to prevent re-renders when parent updates (price changes)
export default memo(CoinIconComponent, (prevProps, nextProps) => {
  return (
    prevProps.uri === nextProps.uri &&
    prevProps.symbol === nextProps.symbol &&
    prevProps.size === nextProps.size
  );
});
