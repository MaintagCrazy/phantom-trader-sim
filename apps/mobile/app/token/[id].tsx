import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '@/components/ActionButton';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore } from '@/store/coinsStore';
import colors from '@/constants/colors';

const TIMEFRAMES = ['1', '7', '30', '90', '365'];
const TIMEFRAME_LABELS = ['24H', '7D', '30D', '90D', '1Y'];

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.darkBg },
  loading: { flex: 1, backgroundColor: colors.darkBg, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '600' },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  priceSection: { alignItems: 'center', paddingVertical: 24 },
  price: { color: colors.white, fontSize: 36, fontWeight: '700' },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  changeText: { fontSize: 18, marginLeft: 4 },
  chartPlaceholder: { height: 192, marginHorizontal: 16, backgroundColor: colors.cardBg, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  chartText: { color: colors.gray, marginTop: 8 },
  timeframeRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginBottom: 24 },
  timeframeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  timeframeBtnActive: { backgroundColor: colors.purpleHeart },
  timeframeBtnInactive: { backgroundColor: colors.cardBg },
  timeframeText: { fontSize: 14, fontWeight: '500' },
  timeframeTextActive: { color: colors.white },
  timeframeTextInactive: { color: colors.gray },
  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { color: colors.white, fontWeight: '600', fontSize: 18, marginBottom: 12 },
  card: { backgroundColor: colors.cardBg, borderRadius: 16, padding: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statRowLast: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { color: colors.gray },
  statValue: { color: colors.white },
  tradeSection: { marginHorizontal: 16, marginBottom: 32 },
  tradeTabs: { flexDirection: 'row', marginBottom: 16 },
  tradeTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tradeTabLeft: { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  tradeTabRight: { borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  tradeTabActive: { backgroundColor: colors.purpleHeart },
  tradeTabInactive: { backgroundColor: colors.cardBg },
  tradeTabText: { fontWeight: '600' },
  tradeTabTextActive: { color: colors.white },
  tradeTabTextInactive: { color: colors.gray },
  amountBtns: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  amountBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  amountBtnActive: { backgroundColor: colors.purpleHeart },
  amountBtnInactive: { backgroundColor: colors.cardBg },
  amountBtnTextActive: { color: colors.white },
  amountBtnTextInactive: { color: colors.gray },
});

export default function TokenDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useUserStore();
  const { portfolio, buy, sell, isLoading } = usePortfolioStore();
  const { coins, selectedCoin, chartDays, fetchCoin, fetchChart, setChartDays } = useCoinsStore();
  const [amount, setAmount] = useState('100');
  const [isBuying, setIsBuying] = useState(true);

  useEffect(() => { if (id) { fetchCoin(id); fetchChart(id, '7'); } }, [id]);

  const coin = selectedCoin || coins.find(c => c.id === id);
  const holding = portfolio?.holdings.find(h => h.coinId === id);

  const handleTimeframeChange = (days: string) => { setChartDays(days); if (id) fetchChart(id, days); };

  const handleTrade = async () => {
    if (!userId || !coin) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) { Alert.alert('Error', 'Please enter a valid amount'); return; }
    let success = false;
    if (isBuying) {
      success = await buy(userId, coin.id, coin.symbol.toUpperCase(), coin.name, amountNum);
      if (success) Alert.alert('Success', `Bought $${amountNum} of ${coin.symbol.toUpperCase()}`);
    } else {
      const cryptoAmount = amountNum / coin.currentPrice;
      success = await sell(userId, coin.id, cryptoAmount);
      if (success) Alert.alert('Success', `Sold $${amountNum} worth of ${coin.symbol.toUpperCase()}`);
    }
  };

  if (!coin) {
    return <SafeAreaView style={styles.loading}><Text style={styles.loadingText}>Loading...</Text></SafeAreaView>;
  }

  const isPositive = coin.priceChange24h >= 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={24} color={colors.white} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{coin.name}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.priceSection}>
          <Text style={styles.price}>${coin.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</Text>
          <View style={styles.changeRow}>
            <Ionicons name={isPositive ? 'trending-up' : 'trending-down'} size={20} color={isPositive ? colors.green : colors.red} />
            <Text style={[styles.changeText, { color: isPositive ? colors.green : colors.red }]}>{isPositive ? '+' : ''}{coin.priceChange24h.toFixed(2)}%</Text>
          </View>
        </View>

        <View style={styles.chartPlaceholder}>
          <Ionicons name="analytics-outline" size={48} color={colors.gray} />
          <Text style={styles.chartText}>Chart Coming Soon</Text>
        </View>

        <View style={styles.timeframeRow}>
          {TIMEFRAMES.map((days, index) => (
            <TouchableOpacity key={days} onPress={() => handleTimeframeChange(days)} style={[styles.timeframeBtn, chartDays === days ? styles.timeframeBtnActive : styles.timeframeBtnInactive]}>
              <Text style={[styles.timeframeText, chartDays === days ? styles.timeframeTextActive : styles.timeframeTextInactive]}>{TIMEFRAME_LABELS[index]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.card}>
            <View style={styles.statRow}><Text style={styles.statLabel}>Market Cap</Text><Text style={styles.statValue}>${(coin.marketCap / 1e9).toFixed(2)}B</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>24h Volume</Text><Text style={styles.statValue}>${(coin.totalVolume / 1e9).toFixed(2)}B</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Rank</Text><Text style={styles.statValue}>#{coin.marketCapRank}</Text></View>
            <View style={styles.statRowLast}><Text style={styles.statLabel}>All-Time High</Text><Text style={styles.statValue}>${coin.ath.toLocaleString()}</Text></View>
          </View>
        </View>

        {holding && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Holdings</Text>
            <View style={styles.card}>
              <View style={styles.statRow}><Text style={styles.statLabel}>Amount</Text><Text style={styles.statValue}>{holding.amount.toFixed(6)} {coin.symbol.toUpperCase()}</Text></View>
              <View style={styles.statRow}><Text style={styles.statLabel}>Value</Text><Text style={styles.statValue}>${holding.currentValue.toFixed(2)}</Text></View>
              <View style={styles.statRow}><Text style={styles.statLabel}>Avg Buy Price</Text><Text style={styles.statValue}>${holding.avgBuyPrice.toFixed(2)}</Text></View>
              <View style={styles.statRowLast}><Text style={styles.statLabel}>P&L</Text><Text style={{ color: holding.pnl >= 0 ? colors.green : colors.red }}>{holding.pnl >= 0 ? '+' : ''}${holding.pnl.toFixed(2)} ({holding.pnlPercent.toFixed(2)}%)</Text></View>
            </View>
          </View>
        )}

        <View style={styles.tradeSection}>
          <View style={styles.tradeTabs}>
            <TouchableOpacity onPress={() => setIsBuying(true)} style={[styles.tradeTab, styles.tradeTabLeft, isBuying ? styles.tradeTabActive : styles.tradeTabInactive]}>
              <Text style={[styles.tradeTabText, isBuying ? styles.tradeTabTextActive : styles.tradeTabTextInactive]}>Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsBuying(false)} style={[styles.tradeTab, styles.tradeTabRight, !isBuying ? styles.tradeTabActive : styles.tradeTabInactive]}>
              <Text style={[styles.tradeTabText, !isBuying ? styles.tradeTabTextActive : styles.tradeTabTextInactive]}>Sell</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.amountBtns}>
            {['50', '100', '250', '500'].map((amt) => (
              <TouchableOpacity key={amt} onPress={() => setAmount(amt)} style={[styles.amountBtn, amount === amt ? styles.amountBtnActive : styles.amountBtnInactive]}>
                <Text style={amount === amt ? styles.amountBtnTextActive : styles.amountBtnTextInactive}>${amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <ActionButton title={isBuying ? `Buy $${amount} of ${coin.symbol.toUpperCase()}` : `Sell $${amount} of ${coin.symbol.toUpperCase()}`} onPress={handleTrade} fullWidth size="large" loading={isLoading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
