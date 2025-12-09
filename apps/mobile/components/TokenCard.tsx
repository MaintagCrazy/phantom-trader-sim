import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';

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
      className="flex-row items-center p-4 bg-card-bg rounded-2xl mb-3"
      activeOpacity={0.7}
    >
      {/* Token Logo */}
      <View className="w-10 h-10 rounded-full bg-shark mr-3 overflow-hidden">
        {image ? (
          <Image source={{ uri: image }} className="w-full h-full" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Text className="text-white font-bold">{symbol.charAt(0)}</Text>
          </View>
        )}
      </View>

      {/* Token Info */}
      <View className="flex-1">
        <Text className="text-white font-semibold text-base">{name}</Text>
        {showHoldings && amount !== undefined ? (
          <Text className="text-gray-400 text-sm">
            {formatAmount(amount)} {symbol.toUpperCase()}
          </Text>
        ) : (
          <Text className="text-gray-400 text-sm">{symbol.toUpperCase()}</Text>
        )}
      </View>

      {/* Price Info */}
      <View className="items-end">
        {showHoldings && currentValue !== undefined ? (
          <>
            <Text className="text-white font-semibold text-base">
              {formatCurrency(currentValue)}
            </Text>
            <Text style={{ color: changeColor }} className="text-sm">
              {isPositive ? '+' : ''}{priceChange24h.toFixed(2)}%
            </Text>
          </>
        ) : (
          <>
            <Text className="text-white font-semibold text-base">
              {formatCurrency(currentPrice)}
            </Text>
            <Text style={{ color: changeColor }} className="text-sm">
              {isPositive ? '+' : ''}{priceChange24h.toFixed(2)}%
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default TokenCard;
