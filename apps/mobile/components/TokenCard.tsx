import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    marginBottom: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.shark,
    marginRight: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    color: colors.white,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  tokenName: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  tokenDetails: {
    color: colors.gray,
    fontSize: 12,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  tokenValue: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  priceChange: {
    fontSize: 12,
  },
});

interface TokenCardProps {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  amount?: number;
  currentValue?: number;
  currentPrice: number;
  priceChange24h: number;
  showHoldings?: boolean;
}

export function TokenCard({
  id,
  symbol,
  name,
  image,
  amount,
  currentValue,
  currentPrice,
  priceChange24h,
  showHoldings = true,
}: TokenCardProps) {
  const router = useRouter();
  const isPositive = priceChange24h >= 0;
  const changeColor = isPositive ? colors.green : colors.red;

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  };

  const formatAmount = (value: number) => {
    if (value >= 1000) {
      return value.toFixed(2);
    }
    return value.toFixed(value < 0.0001 ? 8 : 4);
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/token/${id}`)}
      style={styles.container}
      activeOpacity={0.7}
    >
      {/* Token Logo */}
      <View style={styles.logo}>
        {image ? (
          <Image source={{ uri: image }} style={styles.logoImage} />
        ) : (
          <Text style={styles.logoPlaceholder}>{symbol.charAt(0)}</Text>
        )}
      </View>

      {/* Token Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.tokenName}>{name}</Text>
        {showHoldings && amount !== undefined ? (
          <Text style={styles.tokenDetails}>
            {formatAmount(amount)} {symbol.toUpperCase()}
          </Text>
        ) : (
          <Text style={styles.tokenDetails}>{symbol.toUpperCase()}</Text>
        )}
      </View>

      {/* Price Info */}
      <View style={styles.priceContainer}>
        {showHoldings && currentValue !== undefined ? (
          <>
            <Text style={styles.tokenValue}>
              {formatCurrency(currentValue)}
            </Text>
            <Text style={[styles.priceChange, { color: changeColor }]}>
              {isPositive ? '+' : ''}{priceChange24h.toFixed(2)}%
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.tokenValue}>
              {formatCurrency(currentPrice)}
            </Text>
            <Text style={[styles.priceChange, { color: changeColor }]}>
              {isPositive ? '+' : ''}{priceChange24h.toFixed(2)}%
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default TokenCard;
