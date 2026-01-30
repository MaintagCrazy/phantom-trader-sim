import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CoinIcon from '@/components/CoinIcon';

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
  onPress?: () => void;
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
  onPress,
}: TokenCardProps) {
  const router = useRouter();
  const isPositive = priceChange24h >= 0;

  const formatCurrency = (value: number) => {
    if (value >= 1) {
      return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const formatAmount = (value: number) => {
    if (value >= 1000) {
      return value.toFixed(2);
    }
    return value.toFixed(value < 0.0001 ? 8 : 4);
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/token/${id}`);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      activeOpacity={0.7}
    >
      {/* Token Logo */}
      <View style={styles.logoContainer}>
        <CoinIcon uri={image} symbol={symbol} size={44} />
      </View>

      {/* Token Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {showHoldings && amount !== undefined ? (
          <Text style={styles.symbol}>
            {formatAmount(amount)} {symbol.toUpperCase()}
          </Text>
        ) : (
          <Text style={styles.symbol}>{symbol.toUpperCase()}</Text>
        )}
      </View>

      {/* Price Info */}
      <View style={styles.priceContainer}>
        <Text style={styles.price}>
          {showHoldings && currentValue !== undefined
            ? formatCurrency(currentValue)
            : formatCurrency(currentPrice)}
        </Text>
        <View style={styles.changeContainer}>
          <Ionicons
            name={isPositive ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={isPositive ? '#30D158' : '#FF453A'}
          />
          <Text style={[styles.change, { color: isPositive ? '#30D158' : '#FF453A' }]}>
            {isPositive ? '+' : ''}{priceChange24h.toFixed(2)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2C2D30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    color: '#8E8E93',
    fontSize: 18,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  name: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  symbol: {
    color: '#8E8E93',
    fontSize: 13,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  change: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 2,
  },
});

export default TokenCard;
