import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import ActionButton from '@/components/ActionButton';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore } from '@/store/coinsStore';
import { previewSwap } from '@/services/api';
import colors from '@/constants/colors';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.darkBg },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  section: { marginTop: 24 },
  sectionLabel: { color: colors.gray, fontSize: 14, marginBottom: 8 },
  card: { backgroundColor: colors.cardBg, borderRadius: 16, padding: 16 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tokenSelect: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.shark, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  tokenText: { color: colors.white, fontWeight: '600', marginRight: 8 },
  maxButton: { color: colors.purpleHeart, fontSize: 14 },
  amountInput: { color: colors.white, fontSize: 28, fontWeight: '700' },
  balanceText: { color: colors.gray, fontSize: 14, marginTop: 8 },
  swapButtonContainer: { alignItems: 'center', marginVertical: 16 },
  swapButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.purpleHeart, alignItems: 'center', justifyContent: 'center' },
  receiveAmount: { color: colors.white, fontSize: 28, fontWeight: '700' },
  usdValue: { color: colors.gray, fontSize: 14, marginTop: 8 },
  rateCard: { marginTop: 16, padding: 16, backgroundColor: colors.cardBg, borderRadius: 16 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rateLabel: { color: colors.gray },
  rateValue: { color: colors.white },
  actionContainer: { marginTop: 32, marginBottom: 24 },
});

export default function SwapScreen() {
  const { userId } = useUserStore();
  const { portfolio, swap, isLoading } = usePortfolioStore();
  const { coins, fetchCoins } = useCoinsStore();

  const [fromCoin, setFromCoin] = useState<string | null>(null);
  const [toCoin, setToCoin] = useState<string | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => { fetchCoins(); }, []);

  useEffect(() => {
    if (portfolio?.holdings.length && !fromCoin) {
      setFromCoin(portfolio.holdings[0].coinId);
    }
    if (coins.length && !toCoin) {
      const defaultTo = coins.find(c => c.id !== fromCoin);
      if (defaultTo) setToCoin(defaultTo.id);
    }
  }, [portfolio, coins, fromCoin, toCoin]);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!fromCoin || !toCoin || !fromAmount || parseFloat(fromAmount) <= 0) {
        setToAmount(''); setPreview(null); return;
      }
      try {
        const result = await previewSwap({ fromCoinId: fromCoin, toCoinId: toCoin, fromAmount: parseFloat(fromAmount) });
        setPreview(result);
        if (result.toAmount) setToAmount(result.toAmount.toFixed(8));
      } catch (error) { console.error('Preview error:', error); }
    };
    const debounce = setTimeout(fetchPreview, 300);
    return () => clearTimeout(debounce);
  }, [fromCoin, toCoin, fromAmount]);

  const getFromCoinInfo = () => {
    const holding = portfolio?.holdings.find(h => h.coinId === fromCoin);
    const coin = coins.find(c => c.id === fromCoin);
    return { symbol: holding?.symbol || coin?.symbol || 'SELECT', name: holding?.name || coin?.name || 'Select Token', balance: holding?.amount || 0, image: coin?.image };
  };

  const getToCoinInfo = () => {
    const coin = coins.find(c => c.id === toCoin);
    return { symbol: coin?.symbol || 'SELECT', name: coin?.name || 'Select Token', image: coin?.image };
  };

  const handleSwapDirection = () => {
    const tempCoin = fromCoin;
    setFromCoin(toCoin); setToCoin(tempCoin); setFromAmount(''); setToAmount('');
  };

  const handleMax = () => {
    const holding = portfolio?.holdings.find(h => h.coinId === fromCoin);
    if (holding) setFromAmount(holding.amount.toString());
  };

  const handleSwap = async () => {
    if (!userId || !fromCoin || !toCoin || !fromAmount) return;
    const fromAmountNum = parseFloat(fromAmount);
    if (isNaN(fromAmountNum) || fromAmountNum <= 0) { Alert.alert('Error', 'Please enter a valid amount'); return; }
    const toCoinInfo = getToCoinInfo();
    const success = await swap(userId, fromCoin, fromAmountNum, toCoin, toCoinInfo.symbol.toUpperCase(), toCoinInfo.name);
    if (success) {
      Alert.alert('Success', `Swapped ${fromAmount} ${getFromCoinInfo().symbol.toUpperCase()} for ${toAmount} ${toCoinInfo.symbol.toUpperCase()}`);
      setFromAmount(''); setToAmount('');
    }
  };

  const fromInfo = getFromCoinInfo();
  const toInfo = getToCoinInfo();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Swap" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>You Pay</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <TouchableOpacity style={styles.tokenSelect}>
                <Text style={styles.tokenText}>{fromInfo.symbol.toUpperCase()}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.gray} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMax}>
                <Text style={styles.maxButton}>MAX</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.amountInput} placeholder="0" placeholderTextColor={colors.gray} keyboardType="decimal-pad" value={fromAmount} onChangeText={setFromAmount} />
            <Text style={styles.balanceText}>Balance: {fromInfo.balance.toFixed(4)} {fromInfo.symbol.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.swapButtonContainer}>
          <TouchableOpacity onPress={handleSwapDirection} style={styles.swapButton}>
            <Ionicons name="swap-vertical" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View>
          <Text style={styles.sectionLabel}>You Receive</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <TouchableOpacity style={styles.tokenSelect}>
                <Text style={styles.tokenText}>{toInfo.symbol.toUpperCase()}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.gray} />
              </TouchableOpacity>
            </View>
            <Text style={styles.receiveAmount}>{toAmount || '0'}</Text>
            {preview?.usdValue && <Text style={styles.usdValue}>≈ ${preview.usdValue.toFixed(2)} USD</Text>}
          </View>
        </View>

        {preview?.exchangeRate && (
          <View style={styles.rateCard}>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Exchange Rate</Text>
              <Text style={styles.rateValue}>1 {fromInfo.symbol.toUpperCase()} = {preview.exchangeRate.toFixed(6)} {toInfo.symbol.toUpperCase()}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionContainer}>
          <ActionButton title={isLoading ? 'Swapping...' : 'Review Swap'} onPress={handleSwap} fullWidth size="large" disabled={!fromAmount || !toAmount || isLoading} loading={isLoading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
