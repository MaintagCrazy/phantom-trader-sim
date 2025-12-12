import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Modal, FlatList, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import ActionButton from '@/components/ActionButton';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore, Coin } from '@/store/coinsStore';
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
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  pickerContainer: { backgroundColor: colors.cardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, paddingBottom: 40, maxHeight: '70%' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  pickerTitle: { color: colors.white, fontSize: 18, fontWeight: '600' },
  closeButton: { padding: 4 },
  coinOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.shark },
  coinImage: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  coinInfo: { flex: 1 },
  coinSymbol: { color: colors.white, fontSize: 16, fontWeight: '600' },
  coinName: { color: colors.gray, fontSize: 14, marginTop: 2 },
  coinPrice: { color: colors.white, fontSize: 14, textAlign: 'right' },
  selectedCoin: { backgroundColor: 'rgba(78, 68, 206, 0.2)' },
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
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

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

  // Get available coins for "from" picker (only holdings)
  const getFromCoins = (): Coin[] => {
    if (!portfolio?.holdings) return [];
    return portfolio.holdings.map(holding => {
      const coin = coins.find(c => c.id === holding.coinId);
      return coin ? { ...coin, amount: holding.amount } : null;
    }).filter(Boolean) as Coin[];
  };

  // Get available coins for "to" picker (all coins except current fromCoin)
  const getToCoins = (): Coin[] => {
    return coins.filter(c => c.id !== fromCoin);
  };

  const selectFromCoin = (coinId: string) => {
    setFromCoin(coinId);
    setFromAmount('');
    setToAmount('');
    setShowFromPicker(false);
  };

  const selectToCoin = (coinId: string) => {
    setToCoin(coinId);
    setToAmount('');
    setShowToPicker(false);
  };

  const fromInfo = getFromCoinInfo();
  const toInfo = getToCoinInfo();

  const renderCoinItem = ({ item, isFrom }: { item: Coin; isFrom: boolean }) => {
    const isSelected = isFrom ? item.id === fromCoin : item.id === toCoin;
    const holding = portfolio?.holdings.find(h => h.coinId === item.id);

    return (
      <TouchableOpacity
        style={[styles.coinOption, isSelected && styles.selectedCoin]}
        onPress={() => isFrom ? selectFromCoin(item.id) : selectToCoin(item.id)}
      >
        <Image source={{ uri: item.image }} style={styles.coinImage} />
        <View style={styles.coinInfo}>
          <Text style={styles.coinSymbol}>{item.symbol.toUpperCase()}</Text>
          <Text style={styles.coinName}>{item.name}</Text>
        </View>
        <View>
          <Text style={styles.coinPrice}>${item.currentPrice?.toLocaleString() || '0'}</Text>
          {holding && <Text style={[styles.coinName, { textAlign: 'right' }]}>{holding.amount.toFixed(4)}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Swap" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>You Pay</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <TouchableOpacity style={styles.tokenSelect} onPress={() => setShowFromPicker(true)}>
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
              <TouchableOpacity style={styles.tokenSelect} onPress={() => setShowToPicker(true)}>
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

      {/* From Coin Picker Modal */}
      <Modal visible={showFromPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Token to Swap</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowFromPicker(false)}>
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={getFromCoins()}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderCoinItem({ item, isFrom: true })}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* To Coin Picker Modal */}
      <Modal visible={showToPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Token to Receive</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowToPicker(false)}>
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={getToCoins()}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderCoinItem({ item, isFrom: false })}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
