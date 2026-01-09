// BMO Wallet Style Activity Screen
// Full transaction history with gradient background

import { View, Text, FlatList, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Theme from '@/styles/theme';
import { useUserStore } from '@/store/userStore';
import { getTransactions, Transaction } from '@/services/api';

export default function ActivityScreen() {
  const { userId } = useUserStore();
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await getTransactions(userId, 1, 50);
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, [userId]);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT': return 'add-circle';
      case 'BUY': return 'arrow-down-circle';
      case 'SELL': return 'arrow-up-circle';
      case 'SWAP': return 'swap-horizontal';
      default: return 'help-circle';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT': return Theme.colors.success;
      case 'BUY': return Theme.colors.primary;
      case 'SELL': return Theme.colors.solana;
      case 'SWAP': return Theme.colors.ethereum;
      default: return Theme.colors.grey;
    }
  };

  const formatTransactionTitle = (tx: Transaction) => {
    switch (tx.type) {
      case 'DEPOSIT': return `Deposited $${tx.depositAmount?.toFixed(2)}`;
      case 'BUY': return `Bought ${tx.toAmount?.toFixed(4)} ${tx.toSymbol}`;
      case 'SELL': return `Sold ${tx.fromAmount?.toFixed(4)} ${tx.fromSymbol}`;
      case 'SWAP': return `Swapped ${tx.fromSymbol} → ${tx.toSymbol}`;
      default: return 'Transaction';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderTransaction = ({ item: tx }: { item: Transaction }) => (
    <View style={styles.txCard}>
      <View style={[styles.txIcon, { backgroundColor: `${getTransactionColor(tx.type)}20` }]}>
        <Ionicons name={getTransactionIcon(tx.type)} size={24} color={getTransactionColor(tx.type)} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txTitle}>{formatTransactionTitle(tx)}</Text>
        <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
      </View>
      <View style={styles.txAmount}>
        <Text style={styles.txValue}>${tx.totalUsdValue.toFixed(2)}</Text>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color={Theme.colors.grey} />
      <Text style={styles.emptyTitle}>No Activity Yet</Text>
      <Text style={styles.emptySubtitle}>Your transaction history will appear here after you make trades</Text>
    </View>
  );

  return (
    <View style={styles.safeAreaBackground}>
      <LinearGradient colors={Theme.colors.primaryLinearGradient} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={25} color={Theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Transaction List */}
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Theme.colors.primary}
              colors={[Theme.colors.primary]}
            />
          }
          ListEmptyComponent={!isLoading ? EmptyState : null}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  safeAreaBackground: {
    flex: 1,
    backgroundColor: '#6155AC',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.medium,
    paddingTop: 60,
    paddingBottom: Theme.spacing.medium,
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
    padding: Theme.spacing.medium,
    paddingBottom: Theme.spacing.huge,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    backgroundColor: `${Theme.colors.dark}90`,
    borderRadius: Theme.borderRadius.large,
    marginBottom: Theme.spacing.small,
  },
  txIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginTop: 4,
  },
  txAmount: {
    alignItems: 'flex-end',
  },
  txValue: {
    color: Theme.colors.white,
    fontWeight: '600',
    fontSize: Theme.fonts.sizes.large,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.extraHuge,
  },
  emptyTitle: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.title,
    fontWeight: '700',
    marginTop: Theme.spacing.large,
  },
  emptySubtitle: {
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.normal,
    textAlign: 'center',
    marginTop: Theme.spacing.small,
    paddingHorizontal: Theme.spacing.huge,
  },
});
