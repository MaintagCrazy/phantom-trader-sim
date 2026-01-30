import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, ViewStyle, TextStyle } from 'react-native';
import Theme from '@/styles/theme';

interface CoinIconProps {
  uri?: string | null;
  symbol: string;
  size?: number;
  style?: ViewStyle;
}

/**
 * CoinIcon component that displays a cryptocurrency icon with fallback.
 * When the image fails to load (CORS, network, etc.), it shows a placeholder
 * with the first letter of the symbol.
 */
export default function CoinIcon({ uri, symbol, size = 44, style }: CoinIconProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
          setIsLoading(false);
        }}
        resizeMode="cover"
      />
    </View>
  );
}
