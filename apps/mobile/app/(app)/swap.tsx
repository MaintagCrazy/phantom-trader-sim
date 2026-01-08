// BMO Wallet Style Swap Screen
// Modal presentation with gradient background

import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Modal, FlatList, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '@/styles/theme';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore, Coin } from '@/store/coinsStore';
import { previewSwap } from '@/services/api';

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
      router.back();
    }
  };

  const getFromCoins = (): Coin[] => {
    if (!portfolio?.holdings) return [];
    return portfolio.holdings.map(holding => {
      const coin = coins.find(c => c.id === holding.coinId);
      return coin ? { ...coin, amount: holding.amount } : null;
    }).filter(Boolean) as Coin[];
  };

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
    <LinearGradient colors={Theme.colors.primaryLinearGradient} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Swap</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* You Pay Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>You Pay</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <TouchableOpacity style={styles.tokenSelect} onPress={() => setShowFromPicker(true)}>
                <Text style={styles.tokenText}>{fromInfo.symbol.toUpperCase()}</Text>
                <Ionicons name="chevron-down" size={16} color={Theme.colors.lightGrey} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMax}>
                <Text style={styles.maxButton}>MAX</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={Theme.colors.grey}
              keyboardType="decimal-pad"
              value={fromAmount}
              onChangeText={setFromAmount}
            />
            <Text style={styles.balanceText}>Balance: {fromInfo.balance.toFixed(4)} {fromInfo.symbol.toUpperCase()}</Text>
          </View>
        </View>

        {/* Swap Direction Button */}
        <View style={styles.swapButtonContainer}>
          <TouchableOpacity onPress={handleSwapDirection} style={styles.swapDirectionButton}>
            <Ionicons name="swap-vertical" size={24} color={Theme.colors.white} />
          </TouchableOpacity>
        </View>

        {/* You Receive Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>You Receive</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <TouchableOpacity style={styles.tokenSelect} onPress={() => setShowToPicker(true)}>
                <Text style={styles.tokenText}>{toInfo.symbol.toUpperCase()}</Text>
                <Ionicons name="chevron-down" size={16} color={Theme.colors.lightGrey} />
              </TouchableOpacity>
            </View>
            <Text style={styles.receiveAmount}>{toAmount || '0'}</Text>
            {preview?.usdValue && <Text style={styles.usdValue}>≈ ${preview.usdValue.toFixed(2)} USD</Text>}
          </View>
        </View>

        {/* Exchange Rate */}
        {preview?.exchangeRate && (
          <View style={styles.rateCard}>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Exchange Rate</Text>
              <Text style={styles.rateValue}>
                1 {fromInfo.symbol.toUpperCase()} = {preview.exchangeRate.toFixed(6)} {toInfo.symbol.toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        {/* Swap Button */}
        <TouchableOpacity
          style={[styles.actionButton, (!fromAmount || !toAmount || isLoading) && styles.actionButtonDisabled]}
          onPress={handleSwap}
          disabled={!fromAmount || !toAmount || isLoading}
        >
          <LinearGradient
            colors={(!fromAmount || !toAmount || isLoading)
              ? [Theme.colors.grey, Theme.colors.grey]
              : Theme.colors.primaryLinearGradient
            }
            style={styles.actionButtonGradient}
          >
            <Text style={styles.actionButtonText}>
              {isLoading ? 'Swapping...' : 'Review Swap'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* From Coin Picker Modal */}
      <Modal visible={showFromPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Token to Swap</Text>
              <TouchableOpacity onPress={() => setShowFromPicker(false)}>
                <Ionicons name="close" size={24} color={Theme.colors.white} />
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
              <TouchableOpacity onPress={() => setShowToPicker(false)}>
                <Ionicons name="close" size={24} color={Theme.colors.white} />
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.medium,
    paddingTop: 60,
    paddingBottom: Theme.spacing.medium,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.header,
    fontWeight: '700',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Theme.spacing.medium,
  },
  section: {
    marginBottom: Theme.spacing.small,
  },
  sectionLabel: {
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.normal,
    marginBottom: Theme.spacing.small,
  },
  card: {
    backgroundColor: `${Theme.colors.dark}90`,
    borderRadius: Theme.borderRadius.large,
    padding: Theme.spacing.medium,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.medium,
  },
  tokenSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.lightDark,
    borderRadius: Theme.borderRadius.default,
    paddingHorizontal: Theme.spacing.medium,
    paddingVertical: Theme.spacing.small,
  },
  tokenText: {
    color: Theme.colors.white,
    fontWeight: '600',
    marginRight: Theme.spacing.small,
  },
  maxButton: {
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  amountInput: {
    color: Theme.colors.white,
    fontSize: 32,
    fontWeight: '700',
  },
  balanceText: {
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.normal,
    marginTop: Theme.spacing.small,
  },
  swapButtonContainer: {
    alignItems: 'center',
    marginVertical: Theme.spacing.small,
  },
  swapDirectionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiveAmount: {
    color: Theme.colors.white,
    fontSize: 32,
    fontWeight: '700',
  },
  usdValue: {
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.normal,
    marginTop: Theme.spacing.small,
  },
  rateCard: {
    marginTop: Theme.spacing.medium,
    padding: Theme.spacing.medium,
    backgroundColor: `${Theme.colors.dark}90`,
    borderRadius: Theme.borderRadius.large,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rateLabel: {
    color: Theme.colors.lightGrey,
  },
  rateValue: {
    color: Theme.colors.white,
  },
  actionButton: {
    marginTop: Theme.spacing.large,
    marginBottom: Theme.spacing.huge,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonGradient: {
    height: 56,
    borderRadius: Theme.borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.large,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: Theme.colors.dark,
    borderTopLeftRadius: Theme.borderRadius.extraLarge,
    borderTopRightRadius: Theme.borderRadius.extraLarge,
    paddingTop: Theme.spacing.large,
    paddingBottom: Theme.spacing.huge,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.large,
    marginBottom: Theme.spacing.medium,
  },
  pickerTitle: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.header,
    fontWeight: '600',
  },
  coinOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.large,
    paddingVertical: Theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.lightDark,
  },
  coinImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Theme.spacing.medium,
  },
  coinInfo: {
    flex: 1,
  },
  coinSymbol: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.large,
    fontWeight: '600',
  },
  coinName: {
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.normal,
    marginTop: 2,
  },
  coinPrice: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.normal,
    textAlign: 'right',
  },
  selectedCoin: {
    backgroundColor: `${Theme.colors.primary}20`,
  },
});
