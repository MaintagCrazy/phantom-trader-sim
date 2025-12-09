import { View, Text, TextInput, FlatList, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import TokenCard from '@/components/TokenCard';
import { useCoinsStore } from '@/store/coinsStore';
import { getCoins, Coin } from '@/services/api';
import colors from '@/constants/colors';

export default function SearchScreen() {
  const { coins, fetchCoins, isLoading } = useCoinsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCoins(1, 50);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = coins.filter(
        (coin) =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query) ||
          coin.id.toLowerCase().includes(query)
      );
      setFilteredCoins(filtered);
    } else {
      setFilteredCoins(coins);
    }
  }, [searchQuery, coins]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCoins(1, 50);
    setRefreshing(false);
  }, [fetchCoins]);

  // Get trending (top gainers)
  const trendingCoins = [...coins]
    .sort((a, b) => b.priceChange24h - a.priceChange24h)
    .slice(0, 5);

  const renderCoin = ({ item: coin }: { item: Coin }) => (
    <TokenCard
      id={coin.id}
      symbol={coin.symbol}
      name={coin.name}
      image={coin.image}
      currentPrice={coin.currentPrice}
      priceChange24h={coin.priceChange24h}
      showHoldings={false}
    />
  );

  const ListHeader = () => (
    <>
      {/* Search Input */}
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-card-bg rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color={colors.gray} />
          <TextInput
            className="flex-1 ml-3 text-white text-base"
            placeholder="Search tokens..."
            placeholderTextColor={colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.gray}
              onPress={() => setSearchQuery('')}
            />
          )}
        </View>
      </View>

      {/* Trending Section */}
      {!searchQuery && trendingCoins.length > 0 && (
        <View className="px-4 mb-4">
          <Text className="text-white font-semibold text-lg mb-3">
            Trending
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {trendingCoins.map((coin) => (
              <View
                key={coin.id}
                className="flex-row items-center bg-card-bg rounded-full px-3 py-2"
              >
                <Text className="text-white font-medium mr-2">
                  {coin.symbol.toUpperCase()}
                </Text>
                <Text
                  style={{
                    color: coin.priceChange24h >= 0 ? colors.green : colors.red,
                  }}
                  className="text-sm"
                >
                  {coin.priceChange24h >= 0 ? '+' : ''}
                  {coin.priceChange24h.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* All Coins Header */}
      <View className="px-4 mb-2">
        <Text className="text-white font-semibold text-lg">
          {searchQuery ? 'Search Results' : 'All Tokens'}
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      <Header title="Discover" />

      <FlatList
        data={filteredCoins}
        renderItem={renderCoin}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.purpleHeart}
          />
        }
        ListEmptyComponent={
          <View className="items-center py-8">
            <Ionicons name="search-outline" size={48} color={colors.gray} />
            <Text className="text-gray-400 mt-4">
              {searchQuery ? 'No tokens found' : 'Loading tokens...'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
