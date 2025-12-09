import { View, Text } from 'react-native';
import colors from '@/constants/colors';

interface BalanceDisplayProps {
  totalValue: number;
  pnl: number;
  pnlPercent: number;
}

export function BalanceDisplay({ totalValue, pnl, pnlPercent }: BalanceDisplayProps) {
  const isPositive = pnl >= 0;
  const pnlColor = isPositive ? colors.green : colors.red;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <View className="items-center py-8">
      <Text className="text-gray-400 text-sm mb-2">Total Balance</Text>
      <Text className="text-white text-4xl font-bold mb-2">
        {formatCurrency(totalValue)}
      </Text>
      <View className="flex-row items-center">
        <Text style={{ color: pnlColor }} className="text-base font-medium">
          {isPositive ? '+' : ''}{formatCurrency(Math.abs(pnl))}
        </Text>
        <Text style={{ color: pnlColor }} className="text-base ml-2">
          ({formatPercent(pnlPercent)})
        </Text>
      </View>
    </View>
  );
}

export default BalanceDisplay;
