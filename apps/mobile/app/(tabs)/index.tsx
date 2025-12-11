import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TokenCard from '@/components/TokenCard';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore, Coin } from '@/store/coinsStore';
import { useAccountsStore } from '@/store/accountsStore';

// Real-time simulation settings
const PRICE_UPDATE_INTERVAL = 1000;
const API_REFRESH_INTERVAL = 60000;

const simulatePriceChange = (price: number, volatility: number = 0.0005) => {
  const change = (Math.random() - 0.5) * 2 * volatility * price;
  return price + change;
};

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [liveCoins, setLiveCoins] = useState<Coin[]>([]);
  const priceUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const apiRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const { userId } = useUserStore();
  const { portfolio, fetchPortfolio } = usePortfolioStore();
  const { coins, fetchCoins, isLoading } = useCoinsStore();
  const { activeAccount, fetchAccounts, migrateToAccounts } = useAccountsStore();

  // Initialize live coins from store
  useEffect(() => {
    if (coins.length > 0) {
      setLiveCoins(coins);
    }
  }, [coins]);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      if (userId) {
        // Migrate to accounts system if needed, then fetch data
        await migrateToAccounts(userId);
        await fetchAccounts(userId);
        fetchPortfolio(userId);
      }
      await fetchCoins(1, 50);
    };
    loadData();
  }, [userId]);

  // Real-time price simulation
  useEffect(() => {
    priceUpdateRef.current = setInterval(() => {
      setLiveCoins(prevCoins => {
        if (prevCoins.length === 0) return prevCoins;
        return prevCoins.map(coin => {
          const volatility = coin.marketCapRank <= 10 ? 0.0003 :
                            coin.marketCapRank <= 50 ? 0.0005 : 0.001;
          const newPrice = simulatePriceChange(coin.currentPrice, volatility);
          const priceChangeAdjust = (Math.random() - 0.5) * 0.02;
          return {
            ...coin,
            currentPrice: newPrice,
            priceChange24h: coin.priceChange24h + priceChangeAdjust,
          };
        });
      });
    }, PRICE_UPDATE_INTERVAL);

    return () => {
      if (priceUpdateRef.current) clearInterval(priceUpdateRef.current);
    };
  }, []);

  // API refresh
  useEffect(() => {
    apiRefreshRef.current = setInterval(async () => {
      await fetchCoins(1, 50);
      if (userId) await fetchPortfolio(userId);
    }, API_REFRESH_INTERVAL);

    return () => {
      if (apiRefreshRef.current) clearInterval(apiRefreshRef.current);
    };
  }, [userId]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (userId) {
        await fetchAccounts(userId);
        await fetchPortfolio(userId);
      }
      await fetchCoins(1, 50);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      // Small delay so user sees spinner
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [userId, fetchAccounts]);

  // Calculate totals
  const totalValue = portfolio?.totalValue || 0;
  const totalPnL = portfolio?.totalPnL || 0;
  const totalPnLPercent = portfolio?.totalPnLPercent || 0;
  const cashBalance = portfolio?.cashBalance || 0;
  const holdings = portfolio?.holdings || [];
  const isPositive = totalPnL >= 0;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.container}>
      {/* ========== FIXED HEADER - Outside ScrollView ========== */}
      <SafeAreaView edges={Platform.OS === 'web' ? [] : ['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={() => router.push('/accounts')}
          >
            <View style={styles.accountIcon}>
              <Text style={styles.accountIconText}>
                {activeAccount?.name?.charAt(0).toUpperCase() || 'T'}
              </Text>
            </View>
            <Text style={styles.accountName}>
              {activeAccount?.name || 'Trade Demo'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#8E8E93" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ========== SCROLLABLE CONTENT ========== */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4E44CE"
            colors={['#4E44CE']}
            progressBackgroundColor="#1C1C1E"
          />
        }
      >
        {/* Balance Section */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(totalValue)}</Text>
          <View style={styles.pnlContainer}>
            <Ionicons
              name={isPositive ? 'arrow-up' : 'arrow-down'}
              size={16}
              color={isPositive ? '#30D158' : '#FF453A'}
            />
            <Text style={[styles.pnlText, { color: isPositive ? '#30D158' : '#FF453A' }]}>
              {isPositive ? '+' : ''}{formatCurrency(totalPnL)} ({isPositive ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/deposit')}
          >
            <LinearGradient
              colors={['#4E44CE', '#6B5DD3']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="add" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.actionButtonLabel}>Deposit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/margin')}
          >
            <LinearGradient
              colors={['#4E44CE', '#6B5DD3']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="trending-up" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.actionButtonLabel}>Margin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/swap')}
          >
            <LinearGradient
              colors={['#4E44CE', '#6B5DD3']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="swap-horizontal" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.actionButtonLabel}>Swap</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <LinearGradient
              colors={['#4E44CE', '#6B5DD3']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="cart" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.actionButtonLabel}>Buy</Text>
          </TouchableOpacity>
        </View>

        {/* Holdings Section */}
        {holdings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Holdings</Text>
            {holdings.map((holding) => {
              const liveCoin = liveCoins.find(c => c.id === holding.coinId);
              const livePrice = liveCoin?.currentPrice || holding.currentPrice;
              const liveValue = holding.amount * livePrice;
              return (
                <TokenCard
                  key={holding.coinId}
                  id={holding.coinId}
                  symbol={holding.symbol}
                  name={holding.name || holding.coinId}
                  image={liveCoin?.image || holding.image}
                  amount={holding.amount}
                  currentValue={liveValue}
                  currentPrice={livePrice}
                  priceChange24h={liveCoin?.priceChange24h || 0}
                  showHoldings={true}
                />
              );
            })}
          </View>
        )}

        {/* Cash Balance */}
        {cashBalance > 0 && (
          <View style={styles.section}>
            <View style={styles.cashCard}>
              <View style={styles.cashLeft}>
                <View style={styles.cashIcon}>
                  <Text style={styles.cashIconText}>$</Text>
                </View>
                <View>
                  <Text style={styles.cashTitle}>USD Cash</Text>
                  <Text style={styles.cashSubtitle}>Available to trade</Text>
                </View>
              </View>
              <Text style={styles.cashAmount}>{formatCurrency(cashBalance)}</Text>
            </View>
          </View>
        )}

        {/* Popular Tokens */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Popular Tokens</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
          </View>

          {isLoading && liveCoins.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4E44CE" />
              <Text style={styles.loadingText}>Loading prices...</Text>
            </View>
          ) : liveCoins.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="wifi-outline" size={48} color="#636366" />
              <Text style={styles.emptyText}>Unable to load prices</Text>
              <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Tap to retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            liveCoins.slice(0, 10).map((coin) => (
              <TokenCard
                key={coin.id}
                id={coin.id}
                symbol={coin.symbol}
                name={coin.name}
                image={coin.image}
                currentPrice={coin.currentPrice}
                priceChange24h={coin.priceChange24h}
                showHoldings={false}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131314',
  },
  headerSafeArea: {
    backgroundColor: '#131314',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4E44CE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  accountIconText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  accountName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90, // Space for fixed tab bar
    flexGrow: 1,
  },

  // Balance Section
  balanceSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  balanceLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  pnlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  pnlText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionButtonLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#30D158',
    marginRight: 6,
  },
  liveText: {
    color: '#30D158',
    fontSize: 12,
    fontWeight: '500',
  },
  seeAllLink: {
    color: '#4E44CE',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#8E8E93',
    marginTop: 12,
    fontSize: 14,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4E44CE',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  // Cash Card
  cashCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cashLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cashIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cashIconText: {
    color: '#30D158',
    fontSize: 18,
    fontWeight: '700',
  },
  cashTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cashSubtitle: {
    color: '#8E8E93',
    fontSize: 13,
  },
  cashAmount: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
