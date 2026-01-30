import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import CoinIcon from '@/components/CoinIcon';

export default function ConfirmTradeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    coinId: string;
    coinSymbol: string;
    coinName: string;
    coinImage: string;
    currentPrice: string;
    usdAmount: string;
    cryptoAmount: string;
    isBuying: string;
    cashBalance: string;
    holdingAmount?: string;
  }>();

  const { userId } = useUserStore();
  const { buy, sell, isLoading } = usePortfolioStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const isBuying = params.isBuying === 'true';
  const usdAmount = parseFloat(params.usdAmount) || 0;
  const cryptoAmount = parseFloat(params.cryptoAmount) || 0;
  const currentPrice = parseFloat(params.currentPrice) || 0;
  const cashBalance = parseFloat(params.cashBalance) || 0;
  const holdingAmount = parseFloat(params.holdingAmount || '0');

  const afterTradeBalance = isBuying
    ? cashBalance - usdAmount
    : cashBalance + usdAmount;

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
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const handleConfirm = async () => {
    if (!userId || isProcessing) return;

    setIsProcessing(true);
    let success = false;

    try {
      if (isBuying) {
        success = await buy(
          userId,
          params.coinId,
          params.coinSymbol.toUpperCase(),
          params.coinName,
          usdAmount
        );
      } else {
        success = await sell(userId, params.coinId, cryptoAmount);
      }

      // Navigate to result screen
      router.replace({
        pathname: '/trade-result',
        params: {
          success: success.toString(),
          isBuying: isBuying.toString(),
          coinSymbol: params.coinSymbol,
          coinName: params.coinName,
          coinImage: params.coinImage,
          usdAmount: usdAmount.toString(),
          cryptoAmount: cryptoAmount.toString(),
        },
      });
    } catch (error) {
      // Navigate to error result
      router.replace({
        pathname: '/trade-result',
        params: {
          success: 'false',
          isBuying: isBuying.toString(),
          coinSymbol: params.coinSymbol,
          coinName: params.coinName,
          coinImage: params.coinImage,
          usdAmount: usdAmount.toString(),
          cryptoAmount: cryptoAmount.toString(),
          error: error instanceof Error ? error.message : 'Trade failed',
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Confirm {isBuying ? 'Purchase' : 'Sale'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Coin Info */}
        <View style={styles.coinSection}>
          <CoinIcon uri={params.coinImage} symbol={params.coinSymbol} size={72} style={{ marginBottom: 16 }} />
          <Text style={styles.actionText}>
            {isBuying ? 'Buying' : 'Selling'} {params.coinName}
          </Text>
          <Text style={styles.symbolText}>{params.coinSymbol.toUpperCase()}</Text>
        </View>

        {/* Trade Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>
              {cryptoAmount.toFixed(6)} {params.coinSymbol.toUpperCase()}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>${formatPrice(currentPrice)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={styles.detailValueHighlight}>{formatCurrency(usdAmount)}</Text>
          </View>
        </View>

        {/* Balance Info */}
        <View style={styles.balanceCard}>
          <View style={styles.detailRow}>
            <Text style={styles.balanceLabel}>Available</Text>
            <Text style={styles.balanceValue}>{formatCurrency(cashBalance)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.balanceLabel}>After Trade</Text>
            <Text style={[styles.balanceValue, { color: afterTradeBalance >= 0 ? '#30D158' : '#FF453A' }]}>
              {formatCurrency(afterTradeBalance)}
            </Text>
          </View>
        </View>

        {/* Warning if selling more than owned */}
        {!isBuying && cryptoAmount > holdingAmount && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={20} color="#FF9F0A" />
            <Text style={styles.warningText}>
              You're trying to sell more than you own
            </Text>
          </View>
        )}

        {/* Fee notice */}
        <Text style={styles.feeNotice}>
          <Ionicons name="information-circle-outline" size={14} color="#8E8E93" />
          {' '}No trading fees
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isProcessing}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isProcessing && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={isProcessing}
        >
          <LinearGradient
            colors={isBuying ? ['#30D158', '#28B84C'] : ['#FF453A', '#E63B30']}
            style={styles.confirmButtonGradient}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.confirmButtonText}>
                Confirm {isBuying ? 'Purchase' : 'Sale'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  coinSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  coinImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 16,
  },
  actionText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  symbolText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    color: '#8E8E93',
    fontSize: 15,
  },
  detailValue: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  detailValueHighlight: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2D30',
    marginVertical: 4,
  },
  balanceCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  balanceValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: '#FF9F0A',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  feeNotice: {
    color: '#8E8E93',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2C2D30',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
});
