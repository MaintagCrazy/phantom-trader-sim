// BMO Wallet Style Discover/Search Screen
// Token discovery with gradient background

import { View, Text, TextInput, FlatList, RefreshControl, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '@/styles/theme';
import { useCoinsStore, Coin } from '@/store/coinsStore';

export default function DiscoverScreen() {
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

  const handleTokenPress = (coinId: string) => {
    router.push(`/token/${coinId}`);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    });
  };

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (coinId: string) => {
    setImageErrors(prev => ({ ...prev, [coinId]: true }));
  };

  const renderCoin = ({ item: coin }: { item: Coin }) => {
    const isPositive = coin.priceChange24h >= 0;
    const showPlaceholder = !coin.image || imageErrors[coin.id];

    return (
      <TouchableOpacity
        style={styles.tokenCard}
        onPress={() => handleTokenPress(coin.id)}
        activeOpacity={0.7}
      >
        {showPlaceholder ? (
          <View style={[styles.tokenImage, styles.tokenImagePlaceholder]}>
            <Text style={styles.tokenImageText}>
              {coin.symbol?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: coin.image }}
            style={styles.tokenImage}
            onError={() => handleImageError(coin.id)}
          />
        )}
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenName}>{coin.name}</Text>
          <Text style={styles.tokenSymbol}>{coin.symbol.toUpperCase()}</Text>
        </View>
        <View style={styles.tokenPrice}>
          <Text style={styles.priceText}>{formatPrice(coin.currentPrice)}</Text>
          <View style={styles.changeContainer}>
            <Ionicons
              name={isPositive ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={isPositive ? Theme.colors.success : Theme.colors.accent}
            />
            <Text
              style={[
                styles.changeText,
                { color: isPositive ? Theme.colors.success : Theme.colors.accent },
              ]}
            >
              {isPositive ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <>
      {/* Search Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={Theme.colors.lightGrey} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tokens..."
            placeholderTextColor={Theme.colors.grey}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Theme.colors.grey} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Trending Section */}
      {!searchQuery && trendingCoins.length > 0 && (
        <View style={styles.trendingContainer}>
          <Text style={styles.sectionTitle}>Trending</Text>
          <View style={styles.trendingRow}>
            {trendingCoins.map((coin) => (
              <TouchableOpacity
                key={coin.id}
                style={styles.trendingChip}
                onPress={() => handleTokenPress(coin.id)}
              >
                <Text style={styles.trendingSymbol}>{coin.symbol.toUpperCase()}</Text>
                <Text
                  style={{
                    color: coin.priceChange24h >= 0 ? Theme.colors.success : Theme.colors.accent,
                    fontSize: Theme.fonts.sizes.small,
                  }}
                >
                  {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(1)}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* All Tokens Header */}
      <View style={styles.allTokensHeader}>
        <Text style={styles.sectionTitle}>{searchQuery ? 'Search Results' : 'All Tokens'}</Text>
      </View>
    </>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={48} color={Theme.colors.grey} />
      <Text style={styles.emptyText}>
        {searchQuery ? 'No tokens found' : 'Loading tokens...'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={25} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Token List */}
      <FlatList
        data={filteredCoins}
        renderItem={renderCoin}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.colors.primary}
            colors={[Theme.colors.primary]}
          />
        }
        ListEmptyComponent={EmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131314',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.medium,
    paddingTop: 60,
    paddingBottom: Theme.spacing.small,
  },
  backButton: {
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
  listContent: {
    paddingHorizontal: Theme.spacing.medium,
    paddingBottom: Theme.spacing.huge,
  },
  searchContainer: {
    marginBottom: Theme.spacing.medium,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Theme.colors.dark}90`,
    borderRadius: Theme.borderRadius.default,
    paddingHorizontal: Theme.spacing.medium,
    paddingVertical: Theme.spacing.medium,
  },
  searchInput: {
    flex: 1,
    marginLeft: Theme.spacing.small,
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.large,
  },
  trendingContainer: {
    marginBottom: Theme.spacing.medium,
  },
  sectionTitle: {
    color: Theme.colors.white,
    fontWeight: '600',
    fontSize: Theme.fonts.sizes.header,
    marginBottom: Theme.spacing.small,
  },
  trendingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.small,
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Theme.colors.dark}90`,
    borderRadius: Theme.borderRadius.round,
    paddingHorizontal: Theme.spacing.medium,
    paddingVertical: Theme.spacing.small,
  },
  trendingSymbol: {
    color: Theme.colors.white,
    fontWeight: '500',
    marginRight: Theme.spacing.small,
  },
  allTokensHeader: {
    marginBottom: Theme.spacing.small,
  },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    backgroundColor: `${Theme.colors.dark}90`,
    borderRadius: Theme.borderRadius.large,
    marginBottom: Theme.spacing.small,
  },
  tokenImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Theme.spacing.medium,
  },
  tokenImagePlaceholder: {
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenImageText: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.header,
    fontWeight: '700',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    color: Theme.colors.white,
    fontWeight: '600',
    fontSize: Theme.fonts.sizes.large,
  },
  tokenSymbol: {
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.normal,
    marginTop: 2,
  },
  tokenPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    color: Theme.colors.white,
    fontWeight: '600',
    fontSize: Theme.fonts.sizes.large,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  changeText: {
    fontSize: Theme.fonts.sizes.small,
    marginLeft: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.huge,
  },
  emptyText: {
    color: Theme.colors.lightGrey,
    marginTop: Theme.spacing.medium,
    fontSize: Theme.fonts.sizes.large,
  },
});
