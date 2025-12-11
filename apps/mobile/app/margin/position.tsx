import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore } from '@/store/coinsStore';
import { useMarginStore, MarginPosition } from '@/store/marginStore';

export default function PositionDetailScreen() {
  const router = useRouter();
  const { positionId } = useLocalSearchParams<{ positionId: string }>();

  const { userId } = useUserStore();
  const { fetchPortfolio } = usePortfolioStore();
  const { coins } = useCoinsStore();
  const { positions, closePosition, fetchPositions, isLoading } = useMarginStore();

  const [isClosing, setIsClosing] = useState(false);

  const position = positions.find(p => p.id === positionId);
  const coin = coins.find(c => c.id === position?.coinId);
  const currentPrice = coin?.currentPrice || position?.entryPrice || 0;

  // Calculate live P&L
  const calculatePnL = () => {
    if (!position) return { pnl: 0, pnlPercent: 0 };

    let pnlPercent: number;
    if (position.type === 'LONG') {
      pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * position.leverage * 100;
    } else {
      pnlPercent = ((position.entryPrice - currentPrice) / position.entryPrice) * position.leverage * 100;
    }

    const pnl = (pnlPercent / 100) * position.margin;
    return { pnl, pnlPercent };
  };

  const { pnl, pnlPercent } = calculatePnL();
  const isProfitable = pnl >= 0;
  const currentValue = position ? position.margin + pnl : 0;

  // Calculate distance to liquidation
  const distanceToLiquidation = position
    ? Math.abs((currentPrice - position.liquidationPrice) / currentPrice) * 100
    : 0;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPrice = (value: number) => {
    if (value >= 1) {
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const handleClosePosition = () => {
    if (!position || !userId) return;

    Alert.alert(
      'Close Position',
      `Are you sure you want to close this ${position.type} position?\n\nYou will ${isProfitable ? 'receive' : 'lose'} approximately ${formatCurrency(Math.abs(pnl))}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Position',
          style: isProfitable ? 'default' : 'destructive',
          onPress: async () => {
            setIsClosing(true);
            const result = await closePosition(position.id, userId, currentPrice);

            if (result.success) {
              await fetchPortfolio(userId);
              Alert.alert(
                'Position Closed',
                `${position.type} position closed.\nRealized P&L: ${formatCurrency(result.pnl || 0)}\nReturned to balance: ${formatCurrency(result.marginReturn || 0)}`,
                [{ text: 'OK', onPress: () => router.replace('/margin') }]
              );
            } else {
              Alert.alert('Error', result.error || 'Failed to close position');
            }
            setIsClosing(false);
          },
        },
      ]
    );
  };

  if (!position) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Position</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Position not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{position.symbol}</Text>
          <View style={[
            styles.typeBadge,
            position.type === 'LONG' ? styles.longBadge : styles.shortBadge
          ]}>
            <Text style={styles.typeBadgeText}>
              {position.type} {position.leverage}x
            </Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* P&L Section */}
        <View style={styles.pnlCard}>
          <Text style={styles.pnlLabel}>Unrealized P&L</Text>
          <Text style={[styles.pnlValue, { color: isProfitable ? '#30D158' : '#FF453A' }]}>
            {isProfitable ? '+' : ''}{formatCurrency(pnl)}
          </Text>
          <Text style={[styles.pnlPercent, { color: isProfitable ? '#30D158' : '#FF453A' }]}>
            {isProfitable ? '+' : ''}{pnlPercent.toFixed(2)}%
          </Text>
        </View>

        {/* Current Price */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Current Price</Text>
            <View style={styles.priceValueContainer}>
              <View style={styles.liveDot} />
              <Text style={styles.priceValue}>${formatPrice(currentPrice)}</Text>
            </View>
          </View>
        </View>

        {/* Position Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Position Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Entry Price</Text>
            <Text style={styles.detailValue}>${formatPrice(position.entryPrice)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Position Size</Text>
            <Text style={styles.detailValue}>
              {position.amount.toFixed(6)} {position.symbol}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Position Value</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(position.margin * position.leverage)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Margin</Text>
            <Text style={styles.detailValue}>{formatCurrency(position.margin)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Leverage</Text>
            <Text style={styles.detailValue}>{position.leverage}x</Text>
          </View>
        </View>

        {/* Liquidation Warning */}
        <View style={[
          styles.liquidationCard,
          distanceToLiquidation < 10 && styles.liquidationCardDanger
        ]}>
          <View style={styles.liquidationHeader}>
            <Ionicons
              name="warning"
              size={20}
              color={distanceToLiquidation < 10 ? '#FF453A' : '#FF9F0A'}
            />
            <Text style={[
              styles.liquidationTitle,
              { color: distanceToLiquidation < 10 ? '#FF453A' : '#FF9F0A' }
            ]}>
              Liquidation Risk
            </Text>
          </View>

          <View style={styles.liquidationRow}>
            <Text style={styles.liquidationLabel}>Liquidation Price</Text>
            <Text style={styles.liquidationValue}>
              ${formatPrice(position.liquidationPrice)}
            </Text>
          </View>

          <View style={styles.liquidationRow}>
            <Text style={styles.liquidationLabel}>Distance</Text>
            <Text style={[
              styles.liquidationValue,
              { color: distanceToLiquidation < 10 ? '#FF453A' : 'white' }
            ]}>
              {distanceToLiquidation.toFixed(1)}%
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, 100 - distanceToLiquidation)}%`,
                  backgroundColor: distanceToLiquidation < 10 ? '#FF453A' :
                    distanceToLiquidation < 20 ? '#FF9F0A' : '#30D158'
                }
              ]}
            />
          </View>
        </View>

        {/* Current Value Card */}
        <View style={styles.valueCard}>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Current Value</Text>
            <Text style={styles.valueAmount}>{formatCurrency(currentValue)}</Text>
          </View>
          <Text style={styles.valueHint}>
            This is the amount you'll receive if you close now
          </Text>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={[styles.closeButton, isClosing && styles.closeButtonDisabled]}
          onPress={handleClosePosition}
          disabled={isClosing}
        >
          <LinearGradient
            colors={isProfitable ? ['#30D158', '#28B84C'] : ['#FF453A', '#E63B30']}
            style={styles.closeButtonGradient}
          >
            {isClosing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={styles.closeButtonText}>
                  Close Position
                </Text>
                <Text style={styles.closeButtonSubtext}>
                  {isProfitable ? 'Take Profit' : 'Cut Loss'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Open Time */}
        <Text style={styles.openTime}>
          Opened {new Date(position.createdAt).toLocaleString()}
        </Text>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#131314',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  longBadge: {
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
  },
  shortBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  pnlCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  pnlLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 8,
  },
  pnlValue: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
  },
  pnlPercent: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  priceCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  priceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#30D158',
    marginRight: 8,
  },
  priceValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  detailValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  liquidationCard: {
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.3)',
  },
  liquidationCardDanger: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  liquidationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  liquidationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  liquidationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  liquidationLabel: {
    color: '#8E8E93',
    fontSize: 13,
  },
  liquidationValue: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2C2D30',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  valueCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  valueAmount: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  valueHint: {
    color: '#636366',
    fontSize: 12,
    marginTop: 8,
  },
  closeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  closeButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  closeButtonDisabled: {
    opacity: 0.6,
  },
  openTime: {
    color: '#636366',
    fontSize: 12,
    textAlign: 'center',
  },
});
