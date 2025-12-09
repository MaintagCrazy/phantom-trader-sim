import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
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

export default function SwapScreen() {
  const { userId } = useUserStore();
  const { portfolio, swap, isLoading } = usePortfolioStore();
  const { coins, fetchCoins } = useCoinsStore();

  const [fromCoin, setFromCoin] = useState<string | null>(null);
  const [toCoin, setToCoin] = useState<string | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    fetchCoins();
  }, []);

  // Set defaults
  useEffect(() => {
    if (portfolio?.holdings.length && !fromCoin) {
      setFromCoin(portfolio.holdings[0].coinId);
    }
    if (coins.length && !toCoin) {
      const defaultTo = coins.find(c => c.id !== fromCoin);
      if (defaultTo) setToCoin(defaultTo.id);
    }
  }, [portfolio, coins, fromCoin, toCoin]);

  // Fetch preview when amounts change
  useEffect(() => {
    const fetchPreview = async () => {
      if (!fromCoin || !toCoin || !fromAmount || parseFloat(fromAmount) <= 0) {
        setToAmount('');
        setPreview(null);
        return;
      }

      try {
        const result = await previewSwap({
          fromCoinId: fromCoin,
          toCoinId: toCoin,
          fromAmount: parseFloat(fromAmount),
        });
        setPreview(result);
        if (result.toAmount) {
          setToAmount(result.toAmount.toFixed(8));
        }
      } catch (error) {
        console.error('Preview error:', error);
      }
    };

    const debounce = setTimeout(fetchPreview, 300);
    return () => clearTimeout(debounce);
  }, [fromCoin, toCoin, fromAmount]);

  const getFromCoinInfo = () => {
    const holding = portfolio?.holdings.find(h => h.coinId === fromCoin);
    const coin = coins.find(c => c.id === fromCoin);
    return {
      symbol: holding?.symbol || coin?.symbol || 'SELECT',
      name: holding?.name || coin?.name || 'Select Token',
      balance: holding?.amount || 0,
      image: coin?.image,
    };
  };

  const getToCoinInfo = () => {
    const coin = coins.find(c => c.id === toCoin);
    return {
      symbol: coin?.symbol || 'SELECT',
      name: coin?.name || 'Select Token',
      image: coin?.image,
    };
  };

  const handleSwapDirection = () => {
    const tempCoin = fromCoin;
    setFromCoin(toCoin);
    setToCoin(tempCoin);
    setFromAmount('');
    setToAmount('');
  };

  const handleMax = () => {
    const holding = portfolio?.holdings.find(h => h.coinId === fromCoin);
    if (holding) {
      setFromAmount(holding.amount.toString());
    }
  };

  const handleSwap = async () => {
    if (!userId || !fromCoin || !toCoin || !fromAmount) return;

    const fromAmountNum = parseFloat(fromAmount);
    if (isNaN(fromAmountNum) || fromAmountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const toCoinInfo = getToCoinInfo();

    const success = await swap(
      userId,
      fromCoin,
      fromAmountNum,
      toCoin,
      toCoinInfo.symbol.toUpperCase(),
      toCoinInfo.name
    );

    if (success) {
      Alert.alert('Success', `Swapped ${fromAmount} ${getFromCoinInfo().symbol.toUpperCase()} for ${toAmount} ${toCoinInfo.symbol.toUpperCase()}`);
      setFromAmount('');
      setToAmount('');
    }
  };

  const fromInfo = getFromCoinInfo();
  const toInfo = getToCoinInfo();

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      <Header title="Swap" />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* You Pay Section */}
        <View className="mt-6">
          <Text className="text-gray-400 text-sm mb-2">You Pay</Text>
          <View className="bg-card-bg rounded-2xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity className="flex-row items-center bg-shark rounded-xl px-3 py-2">
                <Text className="text-white font-semibold mr-2">
                  {fromInfo.symbol.toUpperCase()}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.gray} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMax}>
                <Text className="text-purple-heart text-sm">MAX</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              className="text-white text-3xl font-bold"
              placeholder="0"
              placeholderTextColor={colors.gray}
              keyboardType="decimal-pad"
              value={fromAmount}
              onChangeText={setFromAmount}
            />

            <Text className="text-gray-400 text-sm mt-2">
              Balance: {fromInfo.balance.toFixed(4)} {fromInfo.symbol.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Swap Direction Button */}
        <View className="items-center my-4">
          <TouchableOpacity
            onPress={handleSwapDirection}
            className="w-12 h-12 rounded-full bg-purple-heart items-center justify-center"
          >
            <Ionicons name="swap-vertical" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* You Receive Section */}
        <View>
          <Text className="text-gray-400 text-sm mb-2">You Receive</Text>
          <View className="bg-card-bg rounded-2xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity className="flex-row items-center bg-shark rounded-xl px-3 py-2">
                <Text className="text-white font-semibold mr-2">
                  {toInfo.symbol.toUpperCase()}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <Text className="text-white text-3xl font-bold">
              {toAmount || '0'}
            </Text>

            {preview && preview.usdValue && (
              <Text className="text-gray-400 text-sm mt-2">
                ≈ ${preview.usdValue.toFixed(2)} USD
              </Text>
            )}
          </View>
        </View>

        {/* Exchange Rate */}
        {preview && preview.exchangeRate && (
          <View className="mt-4 p-4 bg-card-bg rounded-2xl">
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Exchange Rate</Text>
              <Text className="text-white">
                1 {fromInfo.symbol.toUpperCase()} = {preview.exchangeRate.toFixed(6)} {toInfo.symbol.toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        {/* Swap Button */}
        <View className="mt-8 mb-6">
          <ActionButton
            title={isLoading ? 'Swapping...' : 'Review Swap'}
            onPress={handleSwap}
            fullWidth
            size="large"
            disabled={!fromAmount || !toAmount || isLoading}
            loading={isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
