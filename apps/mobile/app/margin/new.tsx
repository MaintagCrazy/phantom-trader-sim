import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/store/userStore';
import { useAccountsStore } from '@/store/accountsStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore } from '@/store/coinsStore';
import { useMarginStore, LeverageLevel, PositionType } from '@/store/marginStore';

export default function NewPositionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ coinId?: string }>();

  const { userId } = useUserStore();
  const { activeAccount } = useAccountsStore();
  const { portfolio } = usePortfolioStore();
  const { coins } = useCoinsStore();
  const { openPosition, leverageOptions, isLoading } = useMarginStore();

  const [selectedCoin, setSelectedCoin] = useState(params.coinId || 'bitcoin');
  const [positionType, setPositionType] = useState<PositionType>('LONG');
  const [leverage, setLeverage] = useState<LeverageLevel>(2);
  const [marginAmount, setMarginAmount] = useState('100');

  const coin = coins.find(c => c.id === selectedCoin);
  const cashBalance = portfolio?.cashBalance || 0;

  const margin = parseFloat(marginAmount) || 0;
  const positionValue = margin * leverage;
  const cryptoAmount = coin ? positionValue / coin.currentPrice : 0;

  // Calculate liquidation price
  const calculateLiquidationPrice = () => {
    if (!coin) return 0;
    const buffer = 0.05;
    if (positionType === 'LONG') {
      return coin.currentPrice * (1 - (1 / leverage) + buffer);
    } else {
      return coin.currentPrice * (1 + (1 / leverage) - buffer);
    }
  };

  const liquidationPrice = calculateLiquidationPrice();
  const liquidationPercent = coin
    ? Math.abs((liquidationPrice - coin.currentPrice) / coin.currentPrice) * 100
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

  const handleOpenPosition = async () => {
    if (!userId || !coin) return;

    if (margin < 10) {
      Alert.alert('Error', 'Minimum margin is $10');
      return;
    }

    if (margin > cashBalance) {
      Alert.alert('Insufficient Funds', 'You don\'t have enough cash for this margin');
      return;
    }

    const result = await openPosition({
      userId,
      accountId: activeAccount?.id,
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      type: positionType,
      margin,
      leverage,
      currentPrice: coin.currentPrice,
    });

    if (result.success) {
      Alert.alert(
        'Position Opened',
        `Opened ${positionType} position on ${coin.symbol.toUpperCase()} with ${leverage}x leverage`,
        [{ text: 'OK', onPress: () => router.replace('/margin') }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to open position');
    }
  };

  const isDisabled = !margin || margin < 10 || margin > cashBalance || isLoading || !coin;

  // Popular coins for quick selection
  const popularCoins = coins.slice(0, 10);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Open Position</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Coin Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Asset</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.coinsScroll}
          >
            {popularCoins.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.coinChip,
                  selectedCoin === c.id && styles.coinChipActive
                ]}
                onPress={() => setSelectedCoin(c.id)}
              >
                {c.image && (
                  <Image source={{ uri: c.image }} style={styles.coinChipImage} />
                )}
                <Text style={[
                  styles.coinChipText,
                  selectedCoin === c.id && styles.coinChipTextActive
                ]}>
                  {c.symbol.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Current Price */}
        {coin && (
          <View style={styles.priceCard}>
            <View style={styles.priceLeft}>
              {coin.image && (
                <Image source={{ uri: coin.image }} style={styles.priceImage} />
              )}
              <View>
                <Text style={styles.priceName}>{coin.name}</Text>
                <Text style={styles.priceSymbol}>{coin.symbol.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.priceRight}>
              <Text style={styles.priceValue}>${formatPrice(coin.currentPrice)}</Text>
              <Text style={[
                styles.priceChange,
                { color: coin.priceChange24h >= 0 ? '#30D158' : '#FF453A' }
              ]}>
                {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
              </Text>
            </View>
          </View>
        )}

        {/* Position Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Position Type</Text>
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                positionType === 'LONG' && styles.typeBtnLongActive
              ]}
              onPress={() => setPositionType('LONG')}
            >
              <Ionicons
                name="trending-up"
                size={20}
                color={positionType === 'LONG' ? 'white' : '#8E8E93'}
              />
              <Text style={[
                styles.typeBtnText,
                positionType === 'LONG' && styles.typeBtnTextActive
              ]}>
                Long
              </Text>
              <Text style={[
                styles.typeBtnDesc,
                positionType === 'LONG' && styles.typeBtnDescActive
              ]}>
                Profit when price rises
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                positionType === 'SHORT' && styles.typeBtnShortActive
              ]}
              onPress={() => setPositionType('SHORT')}
            >
              <Ionicons
                name="trending-down"
                size={20}
                color={positionType === 'SHORT' ? 'white' : '#8E8E93'}
              />
              <Text style={[
                styles.typeBtnText,
                positionType === 'SHORT' && styles.typeBtnTextActive
              ]}>
                Short
              </Text>
              <Text style={[
                styles.typeBtnDesc,
                positionType === 'SHORT' && styles.typeBtnDescActive
              ]}>
                Profit when price falls
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Leverage Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leverage</Text>
          <View style={styles.leverageOptions}>
            {leverageOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.leverageBtn,
                  leverage === option.value && styles.leverageBtnActive
                ]}
                onPress={() => setLeverage(option.value)}
              >
                <Text style={[
                  styles.leverageValue,
                  leverage === option.value && styles.leverageValueActive
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.leverageRisk,
                  leverage === option.value && styles.leverageRiskActive,
                  {
                    color: leverage === option.value
                      ? 'white'
                      : option.risk === 'Low' ? '#30D158'
                      : option.risk === 'Medium' ? '#FF9F0A'
                      : '#FF453A'
                  }
                ]}>
                  {option.risk} Risk
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Margin Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Margin (Collateral)</Text>
          <View style={styles.marginCard}>
            <View style={styles.marginInputRow}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.marginInput}
                value={marginAmount}
                onChangeText={setMarginAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#636366"
              />
              <TouchableOpacity
                style={styles.maxButton}
                onPress={() => setMarginAmount(Math.floor(cashBalance).toString())}
              >
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.marginAvailable}>
              Available: {formatCurrency(cashBalance)}
            </Text>
          </View>

          <View style={styles.amountBtns}>
            {['50', '100', '250', '500'].map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => setMarginAmount(amt)}
                style={[
                  styles.amountBtn,
                  marginAmount === amt && styles.amountBtnActive
                ]}
              >
                <Text style={[
                  styles.amountBtnText,
                  marginAmount === amt && styles.amountBtnTextActive
                ]}>
                  ${amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Position Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Position Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Position Value</Text>
            <Text style={styles.summaryValue}>{formatCurrency(positionValue)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>
              {cryptoAmount.toFixed(6)} {coin?.symbol.toUpperCase()}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Entry Price</Text>
            <Text style={styles.summaryValue}>
              ${coin ? formatPrice(coin.currentPrice) : '0'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: '#FF9F0A' }]}>
              Liquidation Price
            </Text>
            <Text style={[styles.summaryValue, { color: '#FF9F0A' }]}>
              ${formatPrice(liquidationPrice)} (-{liquidationPercent.toFixed(1)}%)
            </Text>
          </View>
        </View>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={20} color="#FF9F0A" />
          <Text style={styles.warningText}>
            Leverage trading is risky. You can lose your entire margin if the price
            moves {liquidationPercent.toFixed(0)}% against your position.
          </Text>
        </View>

        {/* Open Button */}
        <TouchableOpacity
          style={[styles.openButton, isDisabled && styles.openButtonDisabled]}
          onPress={handleOpenPosition}
          disabled={isDisabled}
        >
          <LinearGradient
            colors={positionType === 'LONG' ? ['#30D158', '#28B84C'] : ['#FF453A', '#E63B30']}
            style={styles.openButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.openButtonText}>
                Open {positionType} Position
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

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
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  coinsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  coinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  coinChipActive: {
    borderColor: '#4E44CE',
    backgroundColor: 'rgba(78, 68, 206, 0.2)',
  },
  coinChipImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  coinChipText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  coinChipTextActive: {
    color: 'white',
  },
  priceCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  priceName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  priceSymbol: {
    color: '#8E8E93',
    fontSize: 13,
  },
  priceRight: {
    alignItems: 'flex-end',
  },
  priceValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  priceChange: {
    fontSize: 13,
    fontWeight: '500',
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeBtnLongActive: {
    borderColor: '#30D158',
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
  },
  typeBtnShortActive: {
    borderColor: '#FF453A',
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
  },
  typeBtnText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  typeBtnTextActive: {
    color: 'white',
  },
  typeBtnDesc: {
    color: '#636366',
    fontSize: 11,
    marginTop: 4,
  },
  typeBtnDescActive: {
    color: '#8E8E93',
  },
  leverageOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  leverageBtn: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  leverageBtnActive: {
    borderColor: '#4E44CE',
    backgroundColor: 'rgba(78, 68, 206, 0.2)',
  },
  leverageValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  leverageValueActive: {
    color: '#4E44CE',
  },
  leverageRisk: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  leverageRiskActive: {
    color: 'white',
  },
  marginCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  marginInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dollarSign: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
    marginRight: 4,
  },
  marginInput: {
    flex: 1,
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
  },
  maxButton: {
    backgroundColor: '#4E44CE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  maxButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  marginAvailable: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 8,
  },
  amountBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  amountBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  amountBtnActive: {
    backgroundColor: '#4E44CE',
  },
  amountBtnText: {
    color: '#8E8E93',
    fontWeight: '500',
  },
  amountBtnTextActive: {
    color: 'white',
  },
  summaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  summaryValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2D30',
    marginVertical: 10,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  warningText: {
    color: '#FF9F0A',
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  openButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  openButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  openButtonDisabled: {
    opacity: 0.5,
  },
});
