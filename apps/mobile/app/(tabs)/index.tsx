import { View, ScrollView, RefreshControl } from 'react-native';
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
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      <Header />

      <ScrollView
        className="flex-1"
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
        <View className="px-4 pb-4">
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
                <View className="flex-row items-center p-4 bg-card-bg rounded-2xl mb-3">
                  <View className="w-10 h-10 rounded-full bg-profit items-center justify-center mr-3">
                    <View className="w-6 h-6 rounded-full border-2 border-white" />
                  </View>
                  <View className="flex-1">
                    <View className="text-white font-semibold text-base">USD Cash</View>
                    <View className="text-gray-400 text-sm">Available to trade</View>
                  </View>
                  <View className="items-end">
                    <View className="text-white font-semibold text-base">
                      ${portfolio?.cashBalance.toFixed(2)}
                    </View>
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
