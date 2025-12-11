import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/store/userStore';
import { useAccountsStore } from '@/store/accountsStore';
import { useMarginStore, MarginPosition } from '@/store/marginStore';
import { useCoinsStore } from '@/store/coinsStore';

export default function MarginScreen() {
  const router = useRouter();
  const { userId } = useUserStore();
  const { activeAccount } = useAccountsStore();
  const { positions, stats, isLoading, fetchLivePositions, fetchStats, fetchPositions } = useMarginStore();
  const { coins } = useCoinsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');

  // Build price map from coins
  const priceMap = coins.reduce((map, coin) => {
    map[coin.id] = coin.currentPrice;
    return map;
  }, {} as Record<string, number>);

  // Fetch positions
  useEffect(() => {
    if (userId) {
      if (activeTab === 'open') {
        fetchLivePositions(userId, priceMap, activeAccount?.id);
      } else {
        fetchPositions(userId, activeAccount?.id, 'ALL');
      }
      fetchStats(userId, activeAccount?.id);
    }
  }, [userId, activeAccount?.id, activeTab]);

  // Refresh positions with live prices
  useEffect(() => {
    if (userId && coins.length > 0 && activeTab === 'open') {
      const interval = setInterval(() => {
        const currentPriceMap = coins.reduce((map, coin) => {
          map[coin.id] = coin.currentPrice;
          return map;
        }, {} as Record<string, number>);
        fetchLivePositions(userId, currentPriceMap, activeAccount?.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [userId, coins, activeAccount?.id, activeTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (userId) {
      if (activeTab === 'open') {
        await fetchLivePositions(userId, priceMap, activeAccount?.id);
      } else {
        await fetchPositions(userId, activeAccount?.id, 'ALL');
      }
      await fetchStats(userId, activeAccount?.id);
    }
    setRefreshing(false);
  }, [userId, activeAccount?.id, priceMap, activeTab]);

  const openPositions = positions.filter(p => p.status === 'OPEN');
  const closedPositions = positions.filter(p => p.status !== 'OPEN');

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getTotalUnrealizedPnL = () => {
    return openPositions.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0);
  };

  const renderPositionCard = (position: MarginPosition) => {
    const isOpen = position.status === 'OPEN';
    const pnl = isOpen ? position.unrealizedPnl || 0 : position.realizedPnl || 0;
    const pnlPercent = isOpen ? position.unrealizedPnlPercent || 0 : 0;
    const isProfitable = pnl >= 0;

    return (
      <TouchableOpacity
        key={position.id}
        style={styles.positionCard}
        onPress={() => {
          if (isOpen) {
            router.push({
              pathname: '/margin/position',
              params: { positionId: position.id },
            });
          }
        }}
        disabled={!isOpen}
      >
        <View style={styles.positionHeader}>
          <View style={styles.positionLeft}>
            <View style={[
              styles.positionTypeBadge,
              position.type === 'LONG' ? styles.longBadge : styles.shortBadge
            ]}>
              <Text style={styles.positionTypeText}>
                {position.type} {position.leverage}x
              </Text>
            </View>
            <Text style={styles.positionSymbol}>{position.symbol}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            position.status === 'OPEN' ? styles.openBadge :
            position.status === 'LIQUIDATED' ? styles.liquidatedBadge : styles.closedBadge
          ]}>
            <Text style={styles.statusText}>{position.status}</Text>
          </View>
        </View>

        <View style={styles.positionDetails}>
          <View style={styles.positionRow}>
            <Text style={styles.positionLabel}>Entry Price</Text>
            <Text style={styles.positionValue}>${position.entryPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.positionRow}>
            <Text style={styles.positionLabel}>Margin</Text>
            <Text style={styles.positionValue}>{formatCurrency(position.margin)}</Text>
          </View>
          <View style={styles.positionRow}>
            <Text style={styles.positionLabel}>Liquidation</Text>
            <Text style={[styles.positionValue, styles.liquidationPrice]}>
              ${position.liquidationPrice.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.pnlSection}>
          <Text style={styles.pnlLabel}>{isOpen ? 'Unrealized P&L' : 'Realized P&L'}</Text>
          <View style={styles.pnlRow}>
            <Text style={[styles.pnlValue, { color: isProfitable ? '#30D158' : '#FF453A' }]}>
              {isProfitable ? '+' : ''}{formatCurrency(pnl)}
            </Text>
            {isOpen && (
              <Text style={[styles.pnlPercent, { color: isProfitable ? '#30D158' : '#FF453A' }]}>
                ({isProfitable ? '+' : ''}{pnlPercent.toFixed(2)}%)
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Margin Trading</Text>
        <TouchableOpacity
          onPress={() => router.push('/margin/new')}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={28} color="#4E44CE" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4E44CE"
            colors={['#4E44CE']}
          />
        }
      >
        {/* Stats Overview */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Open Positions</Text>
              <Text style={styles.statValue}>{stats?.openPositionsCount || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Margin Used</Text>
              <Text style={styles.statValue}>
                {formatCurrency(stats?.totalMarginUsed || 0)}
              </Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Unrealized P&L</Text>
              <Text style={[
                styles.statValue,
                { color: getTotalUnrealizedPnL() >= 0 ? '#30D158' : '#FF453A' }
              ]}>
                {getTotalUnrealizedPnL() >= 0 ? '+' : ''}
                {formatCurrency(getTotalUnrealizedPnL())}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Win Rate</Text>
              <Text style={styles.statValue}>
                {(stats?.winRate || 0).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'open' && styles.tabActive]}
            onPress={() => setActiveTab('open')}
          >
            <Text style={[styles.tabText, activeTab === 'open' && styles.tabTextActive]}>
              Open ({openPositions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Positions List */}
        {isLoading && positions.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4E44CE" />
            <Text style={styles.loadingText}>Loading positions...</Text>
          </View>
        ) : activeTab === 'open' && openPositions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trending-up-outline" size={64} color="#636366" />
            <Text style={styles.emptyTitle}>No Open Positions</Text>
            <Text style={styles.emptyText}>
              Open a leveraged position to start margin trading
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/margin/new')}
            >
              <LinearGradient
                colors={['#4E44CE', '#6B5DD3']}
                style={styles.createButtonGradient}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.createButtonText}>Open Position</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'history' && closedPositions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#636366" />
            <Text style={styles.emptyTitle}>No Trade History</Text>
            <Text style={styles.emptyText}>
              Your closed positions will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.positionsList}>
            {(activeTab === 'open' ? openPositions : closedPositions).map(renderPositionCard)}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#4E44CE',
  },
  tabText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'white',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  positionsList: {
    gap: 12,
  },
  positionCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  longBadge: {
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
  },
  shortBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
  },
  positionTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  positionSymbol: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openBadge: {
    backgroundColor: 'rgba(78, 68, 206, 0.2)',
  },
  closedBadge: {
    backgroundColor: 'rgba(142, 142, 147, 0.2)',
  },
  liquidatedBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
  },
  statusText: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
  },
  positionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#2C2D30',
    paddingTop: 12,
    marginBottom: 12,
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  positionLabel: {
    color: '#8E8E93',
    fontSize: 13,
  },
  positionValue: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  liquidationPrice: {
    color: '#FF9F0A',
  },
  pnlSection: {
    borderTopWidth: 1,
    borderTopColor: '#2C2D30',
    paddingTop: 12,
  },
  pnlLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 4,
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pnlValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  pnlPercent: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});
