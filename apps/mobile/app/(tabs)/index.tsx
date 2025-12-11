import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TokenCard from '@/components/TokenCard';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore } from '@/store/coinsStore';

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { userId } = useUserStore();
  const { portfolio, fetchPortfolio } = usePortfolioStore();
  const { coins, fetchCoins } = useCoinsStore();

  useEffect(() => {
    if (userId) {
      fetchPortfolio(userId);
    }
    fetchCoins(1, 20);
  }, [userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (userId) {
      await fetchPortfolio(userId);
    }
    await fetchCoins(1, 20);
    setRefreshing(false);
  }, [userId]);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.accountIcon}>
            <Text style={styles.accountIconText}>T</Text>
          </View>
          <Text style={styles.accountName}>Trade Demo</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4E44CE"
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

        {/* Action Buttons - Phantom Style */}
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

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#4E44CE', '#6B5DD3']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="arrow-up" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.actionButtonLabel}>Send</Text>
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
              const coin = coins.find(c => c.id === holding.coinId);
              return (
                <TokenCard
                  key={holding.coinId}
                  id={holding.coinId}
                  symbol={holding.symbol}
                  name={holding.name || holding.coinId}
                  image={coin?.image || holding.image}
                  amount={holding.amount}
                  currentValue={holding.currentValue}
                  currentPrice={holding.currentPrice}
                  priceChange24h={coin?.priceChange24h || 0}
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

        {/* Popular Tokens - ALWAYS SHOW */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Tokens</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
          </View>

          {coins.slice(0, 5).map((coin) => (
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
          ))}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: 20,
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
    marginBottom: 12,
  },
  seeAllLink: {
    color: '#4E44CE',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
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
