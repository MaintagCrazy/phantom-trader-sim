import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore } from '@/store/coinsStore';

const TIMEFRAMES = ['1', '7', '30', '90', '365'];
const TIMEFRAME_LABELS = ['24H', '7D', '30D', '90D', '1Y'];

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#131314' },
  loading: { flex: 1, backgroundColor: '#131314', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: 'white', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  priceSection: { alignItems: 'center', paddingVertical: 32 },
  price: { color: 'white', fontSize: 42, fontWeight: '700', letterSpacing: -1 },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  changeText: { fontSize: 18, fontWeight: '500', marginLeft: 4 },
  chartPlaceholder: { height: 200, marginHorizontal: 16, backgroundColor: '#1C1C1E', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  chartText: { color: '#636366', marginTop: 8, fontSize: 14 },
  timeframeRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginBottom: 24 },
  timeframeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  timeframeBtnActive: { backgroundColor: '#4E44CE' },
  timeframeBtnInactive: { backgroundColor: '#1C1C1E' },
  timeframeText: { fontSize: 14, fontWeight: '500' },
  timeframeTextActive: { color: 'white' },
  timeframeTextInactive: { color: '#8E8E93' },
  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { color: 'white', fontWeight: '600', fontSize: 18, marginBottom: 12 },
  card: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statRowLast: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { color: '#8E8E93', fontSize: 14 },
  statValue: { color: 'white', fontSize: 14, fontWeight: '500' },
  tradeSection: { marginHorizontal: 16, marginBottom: 32 },
  tradeTabs: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#1C1C1E', borderRadius: 12, padding: 4 },
  tradeTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  tradeTabBuyActive: { backgroundColor: '#30D158' },
  tradeTabSellActive: { backgroundColor: '#FF453A' },
  tradeTabInactive: { backgroundColor: 'transparent' },
  tradeTabText: { fontWeight: '600', fontSize: 15 },
  tradeTabTextActive: { color: 'white' },
  tradeTabTextInactive: { color: '#8E8E93' },
  amountInputCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 20, marginBottom: 16 },
  amountInputLabel: { color: '#8E8E93', fontSize: 13, marginBottom: 8 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSign: { color: 'white', fontSize: 32, fontWeight: '700', marginRight: 4 },
  amountInput: { flex: 1, color: 'white', fontSize: 32, fontWeight: '700' },
  maxButton: { backgroundColor: '#4E44CE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  maxButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  conversionText: { color: '#8E8E93', fontSize: 13, marginTop: 8 },
  availableRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  availableLabel: { color: '#8E8E93', fontSize: 14 },
  availableValue: { color: 'white', fontSize: 14, fontWeight: '500' },
  amountBtns: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  amountBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  amountBtnActive: { backgroundColor: '#4E44CE' },
  amountBtnInactive: { backgroundColor: '#1C1C1E' },
  amountBtnTextActive: { color: 'white', fontWeight: '600' },
  amountBtnTextInactive: { color: '#8E8E93', fontWeight: '500' },
  tradeButton: { borderRadius: 16, overflow: 'hidden' },
  tradeButtonGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  tradeButtonText: { color: 'white', fontSize: 18, fontWeight: '700' },
  tradeButtonDisabled: { opacity: 0.5 },
  bottomSpacing: { height: 100 },
});

export default function TokenDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useUserStore();
  const { portfolio } = usePortfolioStore();
  const { coins, selectedCoin, chartDays, fetchCoin, fetchChart, setChartDays } = useCoinsStore();
  const [amount, setAmount] = useState('100');
  const [isBuying, setIsBuying] = useState(true);

  useEffect(() => { if (id) { fetchCoin(id); fetchChart(id, '7'); } }, [id]);

  const coin = selectedCoin || coins.find(c => c.id === id);
  const holding = portfolio?.holdings.find(h => h.coinId === id);
  const cashBalance = portfolio?.cashBalance || 0;

  const handleTimeframeChange = (days: string) => { setChartDays(days); if (id) fetchChart(id, days); };

  const handleTrade = () => {
    if (!userId || !coin) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const cryptoAmount = amountNum / coin.currentPrice;

    // Validation
    if (isBuying && amountNum > cashBalance) {
      Alert.alert('Insufficient Funds', 'You don\'t have enough cash balance for this trade.');
      return;
    }
    if (!isBuying && (!holding || cryptoAmount > holding.amount)) {
      Alert.alert('Insufficient Holdings', 'You don\'t have enough of this token to sell.');
      return;
    }

    // Navigate to confirmation screen
    router.push({
      pathname: '/confirm-trade',
      params: {
        coinId: coin.id,
        coinSymbol: coin.symbol,
        coinName: coin.name,
        coinImage: coin.image || '',
        currentPrice: coin.currentPrice.toString(),
        usdAmount: amountNum.toString(),
        cryptoAmount: cryptoAmount.toFixed(8),
        isBuying: isBuying.toString(),
        cashBalance: cashBalance.toString(),
        holdingAmount: holding?.amount.toString() || '0',
      },
    });
  };

  const formatPrice = (value: number) => {
    if (value >= 1) {
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  const getCryptoAmount = () => {
    const amountNum = parseFloat(amount) || 0;
    if (!coin || coin.currentPrice === 0) return '0';
    return (amountNum / coin.currentPrice).toFixed(6);
  };

  const handleMax = () => {
    if (isBuying) {
      setAmount(Math.floor(cashBalance).toString());
    } else if (holding) {
      const maxValue = Math.floor(holding.currentValue);
      setAmount(maxValue.toString());
    }
  };

  if (!coin) {
    return <SafeAreaView style={styles.loading}><Text style={styles.loadingText}>Loading...</Text></SafeAreaView>;
  }

  const isPositive = coin.priceChange24h >= 0;
  const isDisabled = !amount || parseFloat(amount) <= 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {coin.image && <Image source={{ uri: coin.image }} style={styles.headerLogo} />}
          <Text style={styles.headerTitle}>{coin.name}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.priceSection}>
          <Text style={styles.price}>${formatPrice(coin.currentPrice)}</Text>
          <View style={styles.changeRow}>
            <Ionicons name={isPositive ? 'arrow-up' : 'arrow-down'} size={18} color={isPositive ? '#30D158' : '#FF453A'} />
            <Text style={[styles.changeText, { color: isPositive ? '#30D158' : '#FF453A' }]}>
              {isPositive ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
            </Text>
          </View>
        </View>

        <View style={styles.chartPlaceholder}>
          <Ionicons name="analytics-outline" size={48} color="#636366" />
          <Text style={styles.chartText}>Chart Coming Soon</Text>
        </View>

        <View style={styles.timeframeRow}>
          {TIMEFRAMES.map((days, index) => (
            <TouchableOpacity
              key={days}
              onPress={() => handleTimeframeChange(days)}
              style={[styles.timeframeBtn, chartDays === days ? styles.timeframeBtnActive : styles.timeframeBtnInactive]}
            >
              <Text style={[styles.timeframeText, chartDays === days ? styles.timeframeTextActive : styles.timeframeTextInactive]}>
                {TIMEFRAME_LABELS[index]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.card}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Market Cap</Text>
              <Text style={styles.statValue}>${(coin.marketCap / 1e9).toFixed(2)}B</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>24h Volume</Text>
              <Text style={styles.statValue}>${(coin.totalVolume / 1e9).toFixed(2)}B</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Rank</Text>
              <Text style={styles.statValue}>#{coin.marketCapRank}</Text>
            </View>
            <View style={styles.statRowLast}>
              <Text style={styles.statLabel}>All-Time High</Text>
              <Text style={styles.statValue}>${coin.ath?.toLocaleString() || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {holding && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Holdings</Text>
            <View style={styles.card}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Amount</Text>
                <Text style={styles.statValue}>{holding.amount.toFixed(6)} {coin.symbol.toUpperCase()}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Value</Text>
                <Text style={styles.statValue}>${holding.currentValue.toFixed(2)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Avg Buy Price</Text>
                <Text style={styles.statValue}>${holding.avgBuyPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.statRowLast}>
                <Text style={styles.statLabel}>P&L</Text>
                <Text style={{ color: holding.pnl >= 0 ? '#30D158' : '#FF453A', fontSize: 14, fontWeight: '500' }}>
                  {holding.pnl >= 0 ? '+' : ''}${holding.pnl.toFixed(2)} ({holding.pnlPercent.toFixed(2)}%)
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.tradeSection}>
          <View style={styles.tradeTabs}>
            <TouchableOpacity
              onPress={() => setIsBuying(true)}
              style={[styles.tradeTab, isBuying ? styles.tradeTabBuyActive : styles.tradeTabInactive]}
            >
              <Text style={[styles.tradeTabText, isBuying ? styles.tradeTabTextActive : styles.tradeTabTextInactive]}>Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsBuying(false)}
              style={[styles.tradeTab, !isBuying ? styles.tradeTabSellActive : styles.tradeTabInactive]}
            >
              <Text style={[styles.tradeTabText, !isBuying ? styles.tradeTabTextActive : styles.tradeTabTextInactive]}>Sell</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.amountInputCard}>
            <Text style={styles.amountInputLabel}>{isBuying ? 'You Pay (USD)' : 'You Sell (USD value)'}</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="#636366"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
              <TouchableOpacity style={styles.maxButton} onPress={handleMax}>
                <Text style={styles.maxButtonText}>MAX</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.conversionText}>
              ≈ {getCryptoAmount()} {coin.symbol.toUpperCase()}
            </Text>
          </View>

          <View style={styles.availableRow}>
            <Text style={styles.availableLabel}>
              {isBuying ? 'Available Cash' : 'Available to Sell'}
            </Text>
            <Text style={styles.availableValue}>
              {isBuying
                ? `$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : holding
                  ? `${holding.amount.toFixed(6)} ${coin.symbol.toUpperCase()}`
                  : '0'
              }
            </Text>
          </View>

          <View style={styles.amountBtns}>
            {['50', '100', '250', '500'].map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => setAmount(amt)}
                style={[styles.amountBtn, amount === amt ? styles.amountBtnActive : styles.amountBtnInactive]}
              >
                <Text style={amount === amt ? styles.amountBtnTextActive : styles.amountBtnTextInactive}>${amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleTrade}
            disabled={isDisabled}
            style={[styles.tradeButton, isDisabled && styles.tradeButtonDisabled]}
          >
            <LinearGradient
              colors={isBuying ? ['#30D158', '#28B84C'] : ['#FF453A', '#E63B30']}
              style={styles.tradeButtonGradient}
            >
              <Text style={styles.tradeButtonText}>
                {isBuying ? `Buy ${coin.symbol.toUpperCase()}` : `Sell ${coin.symbol.toUpperCase()}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}
