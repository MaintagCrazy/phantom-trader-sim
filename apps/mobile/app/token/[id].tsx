import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
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

export default function TokenDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useUserStore();
  const { portfolio, buy, sell, isLoading } = usePortfolioStore();
  const { coins, selectedCoin, chartData, chartDays, fetchCoin, fetchChart, setChartDays } = useCoinsStore();

  const [amount, setAmount] = useState('100');
  const [isBuying, setIsBuying] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCoin(id);
      fetchChart(id, '7');
    }
  }, [id]);

  const coin = selectedCoin || coins.find(c => c.id === id);
  const holding = portfolio?.holdings.find(h => h.coinId === id);

  const handleTimeframeChange = (days: string) => {
    setChartDays(days);
    if (id) fetchChart(id, days);
  };

  const handleTrade = async () => {
    if (!userId || !coin) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    let success = false;
    if (isBuying) {
      success = await buy(userId, coin.id, coin.symbol.toUpperCase(), coin.name, amountNum);
      if (success) {
        Alert.alert('Success', `Bought $${amountNum} of ${coin.symbol.toUpperCase()}`);
      }
    } else {
      // For selling, amount is in crypto, not USD
      const cryptoAmount = amountNum / coin.currentPrice;
      success = await sell(userId, coin.id, cryptoAmount);
      if (success) {
        Alert.alert('Success', `Sold $${amountNum} worth of ${coin.symbol.toUpperCase()}`);
      }
    }
  };

  if (!coin) {
    return (
      <SafeAreaView className="flex-1 bg-dark-bg items-center justify-center">
        <Text className="text-white">Loading...</Text>
      </SafeAreaView>
    );
  }

  const isPositive = coin.priceChange24h >= 0;

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">{coin.name}</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Price Display */}
        <View className="items-center py-6">
          <Text className="text-white text-4xl font-bold">
            ${coin.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
          </Text>
          <View className="flex-row items-center mt-2">
            <Ionicons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={20}
              color={isPositive ? colors.green : colors.red}
            />
            <Text
              style={{ color: isPositive ? colors.green : colors.red }}
              className="text-lg ml-1"
            >
              {isPositive ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Chart Placeholder */}
        <View className="h-48 mx-4 bg-card-bg rounded-2xl items-center justify-center mb-4">
          <Ionicons name="analytics-outline" size={48} color={colors.gray} />
          <Text className="text-gray-400 mt-2">Chart Coming Soon</Text>
        </View>

        {/* Timeframe Selector */}
        <View className="flex-row justify-around mx-4 mb-6">
          {TIMEFRAMES.map((days, index) => (
            <TouchableOpacity
              key={days}
              onPress={() => handleTimeframeChange(days)}
              className={`px-4 py-2 rounded-lg ${
                chartDays === days ? 'bg-purple-heart' : 'bg-card-bg'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  chartDays === days ? 'text-white' : 'text-gray-400'
                }`}
              >
                {TIMEFRAME_LABELS[index]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View className="mx-4 mb-6">
          <Text className="text-white font-semibold text-lg mb-3">Statistics</Text>
          <View className="bg-card-bg rounded-2xl p-4">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-400">Market Cap</Text>
              <Text className="text-white">
                ${(coin.marketCap / 1e9).toFixed(2)}B
              </Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-400">24h Volume</Text>
              <Text className="text-white">
                ${(coin.totalVolume / 1e9).toFixed(2)}B
              </Text>
            </View>
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-400">Rank</Text>
              <Text className="text-white">#{coin.marketCapRank}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400">All-Time High</Text>
              <Text className="text-white">${coin.ath.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Your Holdings */}
        {holding && (
          <View className="mx-4 mb-6">
            <Text className="text-white font-semibold text-lg mb-3">Your Holdings</Text>
            <View className="bg-card-bg rounded-2xl p-4">
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-400">Amount</Text>
                <Text className="text-white">
                  {holding.amount.toFixed(6)} {coin.symbol.toUpperCase()}
                </Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-400">Value</Text>
                <Text className="text-white">${holding.currentValue.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-400">Avg Buy Price</Text>
                <Text className="text-white">${holding.avgBuyPrice.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-400">P&L</Text>
                <Text
                  style={{ color: holding.pnl >= 0 ? colors.green : colors.red }}
                >
                  {holding.pnl >= 0 ? '+' : ''}${holding.pnl.toFixed(2)} ({holding.pnlPercent.toFixed(2)}%)
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Trade Actions */}
        <View className="mx-4 mb-8">
          <View className="flex-row mb-4">
            <TouchableOpacity
              onPress={() => setIsBuying(true)}
              className={`flex-1 py-3 rounded-l-xl items-center ${
                isBuying ? 'bg-purple-heart' : 'bg-card-bg'
              }`}
            >
              <Text className={`font-semibold ${isBuying ? 'text-white' : 'text-gray-400'}`}>
                Buy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsBuying(false)}
              className={`flex-1 py-3 rounded-r-xl items-center ${
                !isBuying ? 'bg-purple-heart' : 'bg-card-bg'
              }`}
            >
              <Text className={`font-semibold ${!isBuying ? 'text-white' : 'text-gray-400'}`}>
                Sell
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Amount Buttons */}
          <View className="flex-row justify-between mb-4">
            {['50', '100', '250', '500'].map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => setAmount(amt)}
                className={`px-4 py-2 rounded-lg ${
                  amount === amt ? 'bg-purple-heart' : 'bg-card-bg'
                }`}
              >
                <Text className={amount === amt ? 'text-white' : 'text-gray-400'}>
                  ${amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ActionButton
            title={isBuying ? `Buy $${amount} of ${coin.symbol.toUpperCase()}` : `Sell $${amount} of ${coin.symbol.toUpperCase()}`}
            onPress={handleTrade}
            fullWidth
            size="large"
            loading={isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
