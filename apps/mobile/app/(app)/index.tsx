// BMO Wallet Style Home Screen
// Balance + Action Buttons + Transaction List + Assets Section

import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Image,
  ActivityIndicator,
  Animated,
  PanResponder,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import BMOHeader from '@/components/BMOHeader';
import CoinIcon from '@/components/CoinIcon';
import Theme from '@/styles/theme';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore } from '@/store/coinsStore';
import { useAccountsStore } from '@/store/accountsStore';
import { getTransactions, getMarginPositions, Transaction, Holding, MarginPosition, Coin } from '@/services/api';

// Price update intervals
const API_REFRESH_INTERVAL = 30000;

// Pull-to-refresh threshold
const PULL_THRESHOLD = 80;

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [marginPositions, setMarginPositions] = useState<MarginPosition[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [showAssets, setShowAssets] = useState(true);
  const [showMarket, setShowMarket] = useState(true);

  // Pull-to-refresh state for web
  const [pullDistance, setPullDistance] = useState(0);
  const pullAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const isAtTop = useRef(true);
  const startY = useRef(0);
  const isPulling = useRef(false);

  // Balance flash animation
  const [balanceFlash, setBalanceFlash] = useState<'up' | 'down' | null>(null);
  const prevTotalValue = useRef<number | null>(null);
  const balanceColorAnim = useRef(new Animated.Value(0)).current;

  const { userId } = useUserStore();
  const { portfolio, fetchPortfolio } = usePortfolioStore();
  const { coins, fetchCoins } = useCoinsStore();
  const { fetchAccounts, migrateToAccounts } = useAccountsStore();

  // Calculate totals
  const totalValue = portfolio?.totalValue || 0;
  const totalPnL = portfolio?.totalPnL || 0;
  const totalPnLPercent = portfolio?.totalPnLPercent || 0;
  const cashBalance = portfolio?.cashBalance || 0;
  const holdings = portfolio?.holdings || [];
  const isPositive = totalPnL >= 0;

  // Balance flash effect when value changes
  useEffect(() => {
    if (prevTotalValue.current !== null && totalValue !== prevTotalValue.current) {
      const direction = totalValue > prevTotalValue.current ? 'up' : 'down';
      setBalanceFlash(direction);

      // Reset after animation
      const timer = setTimeout(() => {
        setBalanceFlash(null);
      }, 600);

      return () => clearTimeout(timer);
    }
    prevTotalValue.current = totalValue;
  }, [totalValue]);

  // Fetch transactions and margin positions
  const fetchUserTransactions = useCallback(async () => {
    if (!userId) return;
    setIsLoadingTx(true);
    try {
      const [txData, marginData] = await Promise.all([
        getTransactions(userId, 1, 20),
        getMarginPositions(userId).catch(() => ({ positions: [], count: 0 })),
      ]);
      setTransactions(txData.transactions);
      setMarginPositions(marginData.positions.filter((p: MarginPosition) => p.status === 'OPEN'));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoadingTx(false);
    }
  }, [userId]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      if (userId) {
        await migrateToAccounts(userId);
        await fetchAccounts(userId);
        fetchPortfolio(userId);
        fetchUserTransactions();
      }
      await fetchCoins(1, 50);
    };
    loadData();
  }, [userId]);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (userId) {
        fetchPortfolio(userId);
        fetchCoins(1, 50);
      }
    }, API_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [userId]);

  // Pull to refresh - fast, non-blocking
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    // Fire all requests in parallel, don't wait
    if (userId) {
      fetchAccounts(userId);
      fetchPortfolio(userId);
      fetchUserTransactions();
    }
    fetchCoins(1, 50);

    // Quick visual feedback - 800ms
    setTimeout(() => {
      setRefreshing(false);
      setPullDistance(0);
      Animated.spring(pullAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    }, 800);
  }, [userId]);

  // Web pull-to-refresh handlers
  const handleTouchStart = useCallback((e: any) => {
    if (Platform.OS !== 'web') return;
    if (isAtTop.current && !refreshing) {
      startY.current = e.nativeEvent?.pageY || e.touches?.[0]?.pageY || 0;
      isPulling.current = true;
    }
  }, [refreshing]);

  const handleTouchMove = useCallback((e: any) => {
    if (Platform.OS !== 'web' || !isPulling.current || refreshing) return;
    const currentY = e.nativeEvent?.pageY || e.touches?.[0]?.pageY || 0;
    const diff = currentY - startY.current;

    if (diff > 0 && isAtTop.current) {
      const distance = Math.min(diff * 0.5, PULL_THRESHOLD * 1.5);
      setPullDistance(distance);
      pullAnim.setValue(distance);
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(() => {
    if (Platform.OS !== 'web' || !isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      onRefresh();
    } else {
      setPullDistance(0);
      Animated.spring(pullAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [pullDistance, refreshing, onRefresh]);

  const handleScroll = useCallback((e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    isAtTop.current = offsetY <= 0;
  }, []);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Transaction rendering
  const getTransactionIcon = (type: Transaction['type']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'DEPOSIT': return 'add-circle';
      case 'BUY': return 'arrow-down-circle';
      case 'SELL': return 'arrow-up-circle';
      case 'SWAP': return 'swap-horizontal';
      case 'MARGIN_OPEN': return 'trending-up';
      case 'MARGIN_CLOSE': return 'trending-down';
      default: return 'help-circle';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT': return '#30D158';
      case 'BUY': return Theme.colors.primary;
      case 'SELL': return Theme.colors.solana;
      case 'SWAP': return Theme.colors.ethereum;
      case 'MARGIN_OPEN': return '#FF9F0A';
      case 'MARGIN_CLOSE': return '#FF453A';
      default: return Theme.colors.grey;
    }
  };

  const formatTransactionTitle = (tx: Transaction) => {
    switch (tx.type) {
      case 'DEPOSIT': return `Deposited $${tx.depositAmount?.toFixed(2)}`;
      case 'BUY': return `Bought ${tx.toAmount?.toFixed(4)} ${tx.toSymbol}`;
      case 'SELL': return `Sold ${tx.fromAmount?.toFixed(4)} ${tx.fromSymbol}`;
      case 'SWAP': return `Swapped ${tx.fromSymbol} → ${tx.toSymbol}`;
      case 'MARGIN_OPEN': return `Opened ${tx.toSymbol} Long $${tx.totalUsdValue.toFixed(0)}`;
      case 'MARGIN_CLOSE': return `Closed ${tx.fromSymbol || tx.toSymbol} Position`;
      default: return 'Transaction';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Asset Card Component
  const AssetCard = ({ holding }: { holding: Holding }) => {
    const liveCoin = coins.find(c => c.id === holding.coinId);
    const currentPrice = liveCoin?.currentPrice || holding.currentPrice;
    const currentValue = holding.amount * currentPrice;
    const priceChange = liveCoin?.priceChange24h || 0;
    const isUp = priceChange >= 0;
    const coinImage = liveCoin?.image || holding.image;

    return (
      <TouchableOpacity
        style={styles.assetCard}
        onPress={() => router.push(`/token/${holding.coinId}`)}
        activeOpacity={0.7}
      >
        <CoinIcon uri={coinImage} symbol={holding.symbol} size={44} style={{ marginRight: 12 }} />
        <View style={styles.assetInfo}>
          <Text style={styles.assetName}>{holding.name || holding.coinId}</Text>
          <Text style={styles.assetAmount}>
            {holding.amount.toFixed(4)} {holding.symbol?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.assetRight}>
          <Text style={styles.assetValue}>{formatCurrency(currentValue)}</Text>
          <View style={styles.changeRow}>
            <Ionicons
              name={isUp ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={isUp ? '#30D158' : Theme.colors.accent}
            />
            <Text style={[styles.changeText, { color: isUp ? '#30D158' : Theme.colors.accent }]}>
              {isUp ? '+' : ''}{priceChange.toFixed(2)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTransaction = ({ item: tx }: { item: Transaction }) => (
    <TouchableOpacity style={styles.txCard} activeOpacity={0.7}>
      <View style={[styles.txIcon, { backgroundColor: `${getTransactionColor(tx.type)}20` }]}>
        <Ionicons name={getTransactionIcon(tx.type)} size={24} color={getTransactionColor(tx.type)} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txTitle}>{formatTransactionTitle(tx)}</Text>
        <Text style={styles.txDate}>{formatTimeAgo(tx.createdAt)}</Text>
      </View>
      <View style={styles.txAmount}>
        <Text style={styles.txValue}>${tx.totalUsdValue.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  // Calculate pull indicator rotation
  const spinValue = pullAnim.interpolate({
    inputRange: [0, PULL_THRESHOLD],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'clamp',
  });

  // Get balance color based on flash state
  const getBalanceColor = () => {
    if (balanceFlash === 'up') return '#30D158';
    if (balanceFlash === 'down') return Theme.colors.accent;
    return Theme.colors.white;
  };

  const ListHeaderComponent = () => (
    <>
      {/* Web Pull-to-Refresh Indicator - only arrow while pulling */}
      {Platform.OS === 'web' && pullDistance > 0 && !refreshing && (
        <Animated.View
          style={[
            styles.pullIndicator,
            {
              opacity: pullDistance / PULL_THRESHOLD,
            },
          ]}
        >
          <Animated.View style={{ transform: [{ rotate: spinValue }] }}>
            <Ionicons
              name="arrow-down"
              size={24}
              color={pullDistance >= PULL_THRESHOLD ? Theme.colors.primary : Theme.colors.lightGrey}
            />
          </Animated.View>
          {pullDistance >= PULL_THRESHOLD && (
            <Text style={styles.pullIndicatorText}>Release</Text>
          )}
        </Animated.View>
      )}

      {/* Balance Section */}
      <View style={styles.balanceSection}>
        {/* Refresh spinner - above Total Balance */}
        {refreshing && (
          <View style={styles.refreshSpinner}>
            <ActivityIndicator size="small" color={Theme.colors.primary} />
          </View>
        )}
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={[styles.balanceAmount, { color: getBalanceColor() }]}>
          {formatCurrency(totalValue)}
        </Text>
        <View style={styles.pnlContainer}>
          <Ionicons
            name={isPositive ? 'arrow-up' : 'arrow-down'}
            size={14}
            color={isPositive ? '#30D158' : Theme.colors.accent}
          />
          <Text
            style={[
              styles.pnlText,
              { color: isPositive ? '#30D158' : Theme.colors.accent },
            ]}
          >
            {isPositive ? '+' : ''}{formatCurrency(totalPnL)} ({isPositive ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
          </Text>
        </View>
      </View>

      {/* Action Buttons - BMO Style */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(app)/send-options')}
        >
          <LinearGradient
            colors={Theme.colors.primaryLinearGradient}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="arrow-up" size={28} color={Theme.colors.white} />
          </LinearGradient>
          <Text style={styles.actionButtonLabel}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(app)/receive-options')}
        >
          <LinearGradient
            colors={Theme.colors.primaryLinearGradient}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="arrow-down" size={28} color={Theme.colors.white} />
          </LinearGradient>
          <Text style={styles.actionButtonLabel}>Receive</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(app)/swap')}
        >
          <LinearGradient
            colors={Theme.colors.primaryLinearGradient}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="swap-horizontal" size={28} color={Theme.colors.white} />
          </LinearGradient>
          <Text style={styles.actionButtonLabel}>Swap</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/deposit')}
        >
          <LinearGradient
            colors={Theme.colors.primaryLinearGradient}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="add" size={28} color={Theme.colors.white} />
          </LinearGradient>
          <Text style={styles.actionButtonLabel}>Buy</Text>
        </TouchableOpacity>
      </View>

      {/* Assets Section */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setShowAssets(!showAssets)}
      >
        <Text style={styles.sectionTitle}>Assets</Text>
        <Ionicons
          name={showAssets ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={Theme.colors.lightGrey}
        />
      </TouchableOpacity>

      {showAssets && (
        <View style={styles.assetsContainer}>
          {/* Cash Balance */}
          {cashBalance > 0 && (
            <View style={styles.assetCard}>
              <LinearGradient
                colors={['#30D158', '#1B8B4A']}
                style={[styles.assetIcon, styles.cashIcon]}
              >
                <Text style={styles.cashIconText}>$</Text>
              </LinearGradient>
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>USDT</Text>
                <Text style={styles.assetAmount}>Available to trade</Text>
              </View>
              <Text style={styles.assetValue}>{formatCurrency(cashBalance)}</Text>
            </View>
          )}

          {/* Holdings */}
          {holdings.map((holding) => (
            <AssetCard key={holding.coinId} holding={holding} />
          ))}

          {/* Margin Positions */}
          {marginPositions.map((pos) => {
            const liveCoin = coins.find(c => c.id === pos.coinId);
            const currentPrice = liveCoin?.currentPrice || pos.entryPrice;
            const pnl = pos.type === 'LONG'
              ? (currentPrice - pos.entryPrice) * pos.amount * pos.leverage
              : (pos.entryPrice - currentPrice) * pos.amount * pos.leverage;
            const pnlPercent = (pnl / pos.margin) * 100;
            const isUp = pnl >= 0;

            return (
              <TouchableOpacity
                key={pos.id}
                style={styles.assetCard}
                onPress={() => router.push(`/token/${pos.coinId}`)}
                activeOpacity={0.7}
              >
                <CoinIcon uri={liveCoin?.image} symbol={pos.symbol} size={44} style={{ marginRight: 12 }} />
                <View style={styles.assetInfo}>
                  <Text style={styles.assetName}>{pos.name} {pos.leverage}x {pos.type}</Text>
                  <Text style={styles.assetAmount}>
                    Margin: ${pos.margin.toFixed(0)} · Entry: ${pos.entryPrice.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.assetRight}>
                  <Text style={[styles.assetValue, { color: isUp ? '#30D158' : Theme.colors.accent }]}>
                    {isUp ? '+' : ''}{formatCurrency(pnl)}
                  </Text>
                  <View style={styles.changeRow}>
                    <Ionicons
                      name={isUp ? 'arrow-up' : 'arrow-down'}
                      size={12}
                      color={isUp ? '#30D158' : Theme.colors.accent}
                    />
                    <Text style={[styles.changeText, { color: isUp ? '#30D158' : Theme.colors.accent }]}>
                      {isUp ? '+' : ''}{pnlPercent.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {holdings.length === 0 && marginPositions.length === 0 && cashBalance === 0 && (
            <View style={styles.emptyAssets}>
              <Ionicons name="wallet-outline" size={32} color={Theme.colors.grey} />
              <Text style={styles.emptyAssetsText}>No assets yet</Text>
            </View>
          )}
        </View>
      )}

      {/* Top Coins Market Section */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setShowMarket(!showMarket)}
      >
        <Text style={styles.sectionTitle}>Top Coins</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/discover')}>
          <Text style={styles.seeAllLink}>See all</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {showMarket && coins.length > 0 && (
        <View style={styles.assetsContainer}>
          {coins.slice(0, 10).map((coin: Coin) => {
            const isUp = coin.priceChange24h >= 0;
            return (
              <TouchableOpacity
                key={coin.id}
                style={styles.assetCard}
                onPress={() => router.push(`/token/${coin.id}`)}
                activeOpacity={0.7}
              >
                <CoinIcon uri={coin.image} symbol={coin.symbol} size={44} style={{ marginRight: 12 }} />
                <View style={styles.assetInfo}>
                  <Text style={styles.assetName}>{coin.name}</Text>
                  <Text style={styles.assetAmount}>{coin.symbol.toUpperCase()}</Text>
                </View>
                <View style={styles.assetRight}>
                  <Text style={styles.assetValue}>{formatCurrency(coin.currentPrice)}</Text>
                  <View style={styles.changeRow}>
                    <Ionicons
                      name={isUp ? 'arrow-up' : 'arrow-down'}
                      size={12}
                      color={isUp ? '#30D158' : Theme.colors.accent}
                    />
                    <Text style={[styles.changeText, { color: isUp ? '#30D158' : Theme.colors.accent }]}>
                      {isUp ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Transaction History Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/activity')}>
          <Text style={styles.seeAllLink}>See all</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={48} color={Theme.colors.grey} />
      <Text style={styles.emptyText}>No transactions yet</Text>
      <Text style={styles.emptySubtext}>Your activity will appear here</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <BMOHeader />

      {/* Main Content */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Theme.colors.primary}
              colors={[Theme.colors.primary]}
              progressBackgroundColor="transparent"
            />
          ) : undefined
        }
      >
        <ListHeaderComponent />

        {/* Transactions */}
        {transactions.slice(0, 5).length > 0 ? (
          transactions.slice(0, 5).map((tx) => (
            <View key={tx.id}>
              {renderTransaction({ item: tx })}
            </View>
          ))
        ) : (
          !isLoadingTx && <ListEmptyComponent />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingHorizontal: Theme.spacing.medium,
    paddingBottom: Theme.spacing.huge,
  },

  // Balance Section
  balanceSection: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.large,
  },
  balanceLabel: {
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.normal,
    marginBottom: Theme.spacing.small,
  },
  balanceAmount: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.uberHuge,
    fontWeight: '700',
    letterSpacing: -1,
  },
  pnlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.small,
  },
  pnlText: {
    fontSize: Theme.fonts.sizes.large,
    fontWeight: '500',
    marginLeft: 4,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Theme.spacing.medium,
    paddingBottom: Theme.spacing.large,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.small,
  },
  actionButtonLabel: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.small,
    fontWeight: '500',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.medium,
    marginTop: Theme.spacing.medium,
  },
  sectionTitle: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.header,
    fontWeight: '600',
  },
  seeAllLink: {
    color: Theme.colors.primary,
    fontSize: Theme.fonts.sizes.normal,
    fontWeight: '500',
  },

  // Assets Section
  assetsContainer: {
    backgroundColor: `${Theme.colors.dark}80`,
    borderRadius: Theme.borderRadius.large,
    overflow: 'hidden',
    marginBottom: Theme.spacing.medium,
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.lightDark,
  },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Theme.spacing.medium,
  },
  assetIconPlaceholder: {
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assetIconText: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.header,
    fontWeight: '700',
  },
  cashIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashIconText: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.title,
    fontWeight: '700',
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.large,
    fontWeight: '600',
  },
  assetAmount: {
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.normal,
    marginTop: 2,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetValue: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.large,
    fontWeight: '600',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  changeText: {
    fontSize: Theme.fonts.sizes.small,
    marginLeft: 2,
  },
  emptyAssets: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.large,
  },
  emptyAssetsText: {
    color: Theme.colors.lightGrey,
    marginTop: Theme.spacing.small,
  },

  // Transaction Cards
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    backgroundColor: `${Theme.colors.dark}80`,
    borderRadius: Theme.borderRadius.large,
    marginBottom: Theme.spacing.small,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.medium,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    color: Theme.colors.white,
    fontWeight: '600',
    fontSize: Theme.fonts.sizes.large,
  },
  txDate: {
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.normal,
    marginTop: 2,
  },
  txAmount: {
    alignItems: 'flex-end',
  },
  txValue: {
    color: Theme.colors.white,
    fontWeight: '600',
    fontSize: Theme.fonts.sizes.large,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.huge,
  },
  emptyText: {
    fontSize: Theme.fonts.sizes.header,
    fontWeight: '600',
    color: Theme.colors.white,
    marginTop: Theme.spacing.medium,
  },
  emptySubtext: {
    fontSize: Theme.fonts.sizes.normal,
    color: Theme.colors.lightGrey,
    marginTop: Theme.spacing.small,
  },

  // Refresh spinner - positioned above Total Balance
  refreshSpinner: {
    marginBottom: Theme.spacing.small,
  },

  // Web Pull-to-Refresh Indicator
  pullIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.small,
  },
  pullIndicatorText: {
    color: Theme.colors.lightGrey,
    marginLeft: Theme.spacing.small,
    fontSize: Theme.fonts.sizes.small,
  },
});
