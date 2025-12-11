import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export default function TradeResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    success: string;
    isBuying: string;
    coinSymbol: string;
    coinName: string;
    coinImage: string;
    usdAmount: string;
    cryptoAmount: string;
    error?: string;
  }>();

  const success = params.success === 'true';
  const isBuying = params.isBuying === 'true';
  const usdAmount = parseFloat(params.usdAmount) || 0;
  const cryptoAmount = parseFloat(params.cryptoAmount) || 0;

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation sequence
    Animated.sequence([
      // Scale in the icon
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Fade in the content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Checkmark animation for success
    if (success) {
      Animated.timing(checkmarkAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, []);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleViewPortfolio = () => {
    router.replace('/(tabs)/portfolio');
  };

  const handleDone = () => {
    router.replace('/(tabs)');
  };

  const handleTryAgain = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Animated Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {success ? (
            <LinearGradient
              colors={['#30D158', '#28B84C']}
              style={styles.iconCircle}
            >
              <Ionicons name="checkmark" size={48} color="white" />
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={['#FF453A', '#E63B30']}
              style={styles.iconCircle}
            >
              <Ionicons name="close" size={48} color="white" />
            </LinearGradient>
          )}
        </Animated.View>

        {/* Title */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>
            {success
              ? `Trade Complete`
              : 'Trade Failed'}
          </Text>

          {/* Success Details */}
          {success && (
            <View style={styles.detailsContainer}>
              <View style={styles.coinRow}>
                {params.coinImage && (
                  <Image source={{ uri: params.coinImage }} style={styles.coinImage} />
                )}
                <Text style={styles.coinName}>{params.coinName}</Text>
              </View>

              <Text style={styles.tradeDescription}>
                You {isBuying ? 'bought' : 'sold'}{' '}
                <Text style={styles.highlight}>
                  {cryptoAmount.toFixed(6)} {params.coinSymbol.toUpperCase()}
                </Text>
              </Text>

              <Text style={styles.tradeAmount}>
                {isBuying ? 'for' : 'for'} {formatCurrency(usdAmount)}
              </Text>
            </View>
          )}

          {/* Error Details */}
          {!success && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {params.error || 'Something went wrong with your trade'}
              </Text>
              <Text style={styles.errorHint}>
                Please check your balance and try again
              </Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {success ? (
          <>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleViewPortfolio}
            >
              <Text style={styles.secondaryButtonText}>View Portfolio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleDone}
            >
              <LinearGradient
                colors={['#4E44CE', '#6B5DD3']}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleDone}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleTryAgain}
            >
              <LinearGradient
                colors={['#4E44CE', '#6B5DD3']}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#131314',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  detailsContainer: {
    alignItems: 'center',
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coinImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  coinName: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  tradeDescription: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  highlight: {
    color: '#4E44CE',
    fontWeight: '600',
  },
  tradeAmount: {
    color: '#8E8E93',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF453A',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorHint: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#2C2D30',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
