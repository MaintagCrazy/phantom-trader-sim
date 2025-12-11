import { View, ScrollView, RefreshControl, StyleSheet, Text } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header';
import BalanceDisplay from '@/components/BalanceDisplay';
import QuickActions from '@/components/QuickActions';
import TokenCard from '@/components/TokenCard';
import EmptyState from '@/components/EmptyState';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore } from '@/store/coinsStore';
import colors from '@/constants/colors';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  scrollView: {
    flex: 1,
  },
  holdingsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cashCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    marginBottom: 12,
  },
  cashIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cashIconInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.white,
  },
  cashInfo: {
    flex: 1,
  },
  cashLabel: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  cashSubLabel: {
    color: colors.gray,
    fontSize: 12,
  },
  cashAmount: {
    alignItems: 'flex-end',
  },
  cashValue: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const { userId } = useUserStore();
  const { portfolio, isLoading, fetchPortfolio } = usePortfolioStore();
  const { coins, fetchCoins } = useCoinsStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    await Promise.all([fetchPortfolio(userId), fetchCoins()]);
    setRefreshing(false);
  }, [userId, fetchPortfolio, fetchCoins]);

  // Get coin images for holdings
  const getHoldingImage = (coinId: string) => {
    const coin = coins.find(c => c.id === coinId);
    return coin?.image;
  };

  const hasHoldings = portfolio && portfolio.holdings.length > 0;
  const hasCash = portfolio && portfolio.cashBalance > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.purpleHeart}
          />
        }
      >
        {/* Balance Display */}
        <BalanceDisplay
          totalValue={portfolio?.totalValue || 0}
          pnl={portfolio?.totalPnL || 0}
          pnlPercent={portfolio?.totalPnLPercent || 0}
        />

        {/* Quick Actions */}
        <QuickActions />

        {/* Holdings List */}
        <View style={styles.holdingsContainer}>
          {!hasHoldings && !hasCash ? (
            <EmptyState
              icon="wallet-outline"
              title="No Funds Yet"
              description="Add demo funds to start paper trading crypto"
              actionTitle="Add Funds"
              onAction={() => router.push('/deposit')}
            />
          ) : (
            <>
              {/* Cash Balance Card */}
              {hasCash && (
                <View style={styles.cashCard}>
                  <View style={styles.cashIcon}>
                    <View style={styles.cashIconInner} />
                  </View>
                  <View style={styles.cashInfo}>
                    <Text style={styles.cashLabel}>USD Cash</Text>
                    <Text style={styles.cashSubLabel}>Available to trade</Text>
                  </View>
                  <View style={styles.cashAmount}>
                    <Text style={styles.cashValue}>
                      ${portfolio?.cashBalance.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Holdings */}
              {portfolio?.holdings.map((holding) => (
                <TokenCard
                  key={holding.id}
                  id={holding.coinId}
                  symbol={holding.symbol}
                  name={holding.name}
                  image={getHoldingImage(holding.coinId)}
                  amount={holding.amount}
                  currentValue={holding.currentValue}
                  currentPrice={holding.currentPrice}
                  priceChange24h={holding.pnlPercent}
                  showHoldings={true}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
