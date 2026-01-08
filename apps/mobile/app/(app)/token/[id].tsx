// BMO Wallet Token Detail Screen
// Adapted from vinnyhoward/rn-crypto-wallet

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Platform,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '@/styles/theme';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore, Coin } from '@/store/coinsStore';
import { useUserStore } from '@/store/userStore';
import type { Holding } from '@/services/api';
import { formatDollar } from '@/utils/formatDollars';
import { capitalizeFirstLetter } from '@/utils/capitalizeFirstLetter';
import PrimaryButton from '@/components/PrimaryButton/PrimaryButton';
import CryptoInfoCard from '@/components/CryptoInfoCard/CryptoInfoCard';

export default function TokenDetailPage() {
  const { id } = useLocalSearchParams();
  const coinId = id as string;

  const { userId } = useUserStore();
  const { portfolio, fetchPortfolio } = usePortfolioStore();
  const { coins, fetchCoins } = useCoinsStore();

  const [refreshing, setRefreshing] = useState(false);

  // Find the coin and holding
  const coin = useMemo(() => coins.find(c => c.id === coinId), [coins, coinId]);
  const holding = useMemo(
    () => portfolio?.holdings?.find(h => h.coinId === coinId),
    [portfolio, coinId]
  );

  const tokenBalance = holding?.amount || 0;
  const currentPrice = coin?.currentPrice || holding?.currentPrice || 0;
  const usdBalance = tokenBalance * currentPrice;
  const priceChange = coin?.priceChange24h || 0;
  const isPositive = priceChange >= 0;
  const ticker = coin?.symbol?.toUpperCase() || holding?.symbol?.toUpperCase() || '';
  const tokenName = coin?.name || holding?.name || coinId;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (userId) {
        await fetchPortfolio(userId);
      }
      await fetchCoins();
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [userId, fetchPortfolio, fetchCoins]);

  useEffect(() => {
    onRefresh();
  }, []);

  // Mock transaction history (in a real app, this would come from an API)
  const transactions = useMemo(() => {
    // Return empty for now - can be populated from API
    return [];
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.colors.white}
          />
        }
      >
        <View style={styles.contentContainer}>
          {/* Token Icon and Balance */}
          <View style={styles.balanceContainer}>
            {coin?.image || holding?.image ? (
              <Image
                source={{ uri: coin?.image || holding?.image }}
                style={styles.tokenIcon}
              />
            ) : (
              <LinearGradient
                colors={Theme.colors.primaryLinearGradient}
                style={styles.tokenIconPlaceholder}
              >
                <Text style={styles.tokenIconText}>
                  {ticker?.charAt(0) || '?'}
                </Text>
              </LinearGradient>
            )}

            <Text style={styles.balanceTokenText}>
              {tokenBalance.toFixed(6)} {ticker}
            </Text>
            <Text style={styles.balanceUsdText}>{formatDollar(usdBalance)}</Text>

            <View style={styles.priceChangeContainer}>
              <Ionicons
                name={isPositive ? 'arrow-up' : 'arrow-down'}
                size={16}
                color={isPositive ? Theme.colors.success : Theme.colors.accent}
              />
              <Text
                style={[
                  styles.priceChangeText,
                  { color: isPositive ? Theme.colors.success : Theme.colors.accent },
                ]}
              >
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}% (24h)
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <PrimaryButton
              icon={<Ionicons name="arrow-up" size={25} color={Theme.colors.primary} />}
              onPress={() => router.push(`/token/send/${coinId}`)}
              btnText="Send"
            />
            <View style={{ width: 15 }} />
            <PrimaryButton
              icon={<Ionicons name="arrow-down" size={25} color={Theme.colors.primary} />}
              onPress={() => router.push(`/token/receive/${coinId}`)}
              btnText="Receive"
            />
          </View>

          {/* About Section */}
          <Text style={styles.sectionTitle}>About {capitalizeFirstLetter(tokenName)}</Text>
          <View style={styles.infoCardContainer}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Symbol</Text>
                <Text style={styles.infoValue}>{ticker}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Price</Text>
                <Text style={styles.infoValue}>{formatDollar(currentPrice)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Market Cap Rank</Text>
                <Text style={styles.infoValue}>#{coin?.marketCapRank || 'N/A'}</Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Network</Text>
                <Text style={styles.infoValue}>{capitalizeFirstLetter(tokenName)}</Text>
              </View>
            </View>
          </View>

          {/* Transaction History */}
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <View style={styles.transactionContainer}>
            {transactions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={Theme.colors.grey} />
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>
                  Buy or receive {ticker} to see your transaction history
                </Text>
              </View>
            ) : (
              transactions.map((tx: any, index: number) => (
                <CryptoInfoCard
                  key={tx.id || index}
                  title={tx.type}
                  caption={tx.date}
                  details={tx.amount}
                  icon={
                    <Ionicons
                      name={tx.type === 'received' ? 'arrow-down' : 'arrow-up'}
                      size={20}
                      color={Theme.colors.white}
                    />
                  }
                  onPress={() => {}}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => router.push({ pathname: '/swap', params: { mode: 'buy', coinId } })}
        >
          <LinearGradient
            colors={Theme.colors.primaryLinearGradient}
            style={styles.gradientButton}
          >
            <Text style={styles.buyButtonText}>Buy {ticker}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sellButton}
          onPress={() => router.push({ pathname: '/swap', params: { mode: 'sell', coinId } })}
        >
          <Text style={styles.sellButtonText}>Sell {ticker}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.dark,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: Theme.spacing.medium,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.large,
  },
  tokenIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: Theme.spacing.medium,
  },
  tokenIconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.medium,
  },
  tokenIconText: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.title,
    fontWeight: '700',
  },
  balanceTokenText: {
    fontWeight: '700',
    fontSize: Theme.fonts.sizes.huge,
    color: Theme.colors.white,
    textAlign: 'center',
  },
  balanceUsdText: {
    fontWeight: '700',
    fontSize: Theme.fonts.sizes.title,
    color: Theme.colors.lightGrey,
    textAlign: 'center',
    marginTop: Theme.spacing.tiny,
  },
  priceChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.small,
  },
  priceChangeText: {
    fontSize: Theme.fonts.sizes.normal,
    marginLeft: 4,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: Theme.spacing.huge,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: Theme.fonts.sizes.header,
    color: Theme.colors.white,
    marginLeft: Theme.spacing.small,
    marginBottom: Theme.spacing.medium,
  },
  infoCardContainer: {
    marginBottom: Theme.spacing.large,
  },
  infoCard: {
    backgroundColor: Theme.colors.lightDark,
    borderRadius: Theme.borderRadius.large,
    padding: Theme.spacing.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.grey,
  },
  infoLabel: {
    fontSize: Theme.fonts.sizes.normal,
    color: Theme.colors.lightGrey,
  },
  infoValue: {
    fontSize: Theme.fonts.sizes.normal,
    color: Theme.colors.white,
    fontWeight: '600',
  },
  transactionContainer: {
    flex: 1,
    marginBottom: 120,
  },
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
    textAlign: 'center',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.dark,
    padding: Theme.spacing.medium,
    paddingBottom: Platform.OS === 'ios' ? Theme.spacing.large : Theme.spacing.medium,
    flexDirection: 'row',
    gap: Theme.spacing.small,
  },
  buyButton: {
    flex: 1,
    borderRadius: Theme.borderRadius.large,
    overflow: 'hidden',
  },
  gradientButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.borderRadius.large,
  },
  buyButtonText: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.large,
    fontWeight: '700',
  },
  sellButton: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.lightDark,
    borderRadius: Theme.borderRadius.large,
  },
  sellButtonText: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.large,
    fontWeight: '700',
  },
});
