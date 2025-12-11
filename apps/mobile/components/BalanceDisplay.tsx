import { View, Text, StyleSheet } from 'react-native';
import colors from '@/constants/colors';

interface BalanceDisplayProps {
  totalValue: number;
  pnl: number;
  pnlPercent: number;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  label: {
    color: colors.gray,
    fontSize: 12,
    marginBottom: 8,
  },
  amount: {
    color: colors.white,
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pnlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pnlText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pnlPercent: {
    fontSize: 16,
    marginLeft: 8,
  },
});

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
    <View style={styles.container}>
      <Text style={styles.label}>Total Balance</Text>
      <Text style={styles.amount}>
        {formatCurrency(totalValue)}
      </Text>
      <View style={styles.pnlContainer}>
        <Text style={[styles.pnlText, { color: pnlColor }]}>
          {isPositive ? '+' : ''}{formatCurrency(Math.abs(pnl))}
        </Text>
        <Text style={[styles.pnlPercent, { color: pnlColor }]}>
          ({formatPercent(pnlPercent)})
        </Text>
      </View>
    </View>
  );
}

export default BalanceDisplay;
