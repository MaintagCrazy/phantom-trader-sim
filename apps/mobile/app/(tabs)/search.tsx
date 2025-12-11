import { View, Text, TextInput, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import TokenCard from '@/components/TokenCard';
import { useCoinsStore } from '@/store/coinsStore';
import { Coin } from '@/services/api';
import colors from '@/constants/colors';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.darkBg },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  searchInput: { flex: 1, marginLeft: 12, color: colors.white, fontSize: 16 },
  trendingContainer: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: colors.white, fontWeight: '600', fontSize: 18, marginBottom: 12 },
  trendingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trendingChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  trendingSymbol: { color: colors.white, fontWeight: '500', marginRight: 8 },
  allTokensHeader: { paddingHorizontal: 16, marginBottom: 8 },
  emptyContainer: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: colors.gray, marginTop: 16 },
});

export default function SearchScreen() {
  const { coins, fetchCoins, isLoading } = useCoinsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchCoins(1, 50); }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = coins.filter((coin) =>
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

  const trendingCoins = [...coins].sort((a, b) => b.priceChange24h - a.priceChange24h).slice(0, 5);

  const renderCoin = ({ item: coin }: { item: Coin }) => (
    <TokenCard id={coin.id} symbol={coin.symbol} name={coin.name} image={coin.image} currentPrice={coin.currentPrice} priceChange24h={coin.priceChange24h} showHoldings={false} />
  );

  const ListHeader = () => (
    <>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={colors.gray} />
          <TextInput style={styles.searchInput} placeholder="Search tokens..." placeholderTextColor={colors.gray} value={searchQuery} onChangeText={setSearchQuery} />
          {searchQuery.length > 0 && <Ionicons name="close-circle" size={20} color={colors.gray} onPress={() => setSearchQuery('')} />}
        </View>
      </View>

      {!searchQuery && trendingCoins.length > 0 && (
        <View style={styles.trendingContainer}>
          <Text style={styles.sectionTitle}>Trending</Text>
          <View style={styles.trendingRow}>
            {trendingCoins.map((coin) => (
              <View key={coin.id} style={styles.trendingChip}>
                <Text style={styles.trendingSymbol}>{coin.symbol.toUpperCase()}</Text>
                <Text style={{ color: coin.priceChange24h >= 0 ? colors.green : colors.red, fontSize: 14 }}>
                  {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.allTokensHeader}>
        <Text style={styles.sectionTitle}>{searchQuery ? 'Search Results' : 'All Tokens'}</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Discover" />
      <FlatList
        data={filteredCoins}
        renderItem={renderCoin}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purpleHeart} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={colors.gray} />
            <Text style={styles.emptyText}>{searchQuery ? 'No tokens found' : 'Loading tokens...'}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
