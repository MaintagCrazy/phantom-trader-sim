import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/Header';
import EmptyState from '@/components/EmptyState';
import { useUserStore } from '@/store/userStore';
import { getTransactions, Transaction } from '@/services/api';
import colors from '@/constants/colors';

export default function ActivityScreen() {
  const { userId } = useUserStore();
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

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, [userId]);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT':
        return 'add-circle';
      case 'BUY':
        return 'arrow-down-circle';
      case 'SELL':
        return 'arrow-up-circle';
      case 'SWAP':
        return 'swap-horizontal';
      default:
        return 'help-circle';
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT':
        return colors.green;
      case 'BUY':
        return colors.purpleHeart;
      case 'SELL':
        return colors.teal;
      case 'SWAP':
        return colors.purpleLight;
      default:
        return colors.gray;
    }
  };

  const formatTransactionTitle = (tx: Transaction) => {
    switch (tx.type) {
      case 'DEPOSIT':
        return `Deposited $${tx.depositAmount?.toFixed(2)}`;
      case 'BUY':
        return `Bought ${tx.toAmount?.toFixed(4)} ${tx.toSymbol}`;
      case 'SELL':
        return `Sold ${tx.fromAmount?.toFixed(4)} ${tx.fromSymbol}`;
      case 'SWAP':
        return `Swapped ${tx.fromSymbol} → ${tx.toSymbol}`;
      default:
        return 'Transaction';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTransaction = ({ item: tx }: { item: Transaction }) => (
    <View className="flex-row items-center p-4 bg-card-bg rounded-2xl mb-3">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${getTransactionColor(tx.type)}20` }}
      >
        <Ionicons
          name={getTransactionIcon(tx.type)}
          size={24}
          color={getTransactionColor(tx.type)}
        />
      </View>

      <View className="flex-1">
        <Text className="text-white font-semibold text-base">
          {formatTransactionTitle(tx)}
        </Text>
        <Text className="text-gray-400 text-sm">
          {formatDate(tx.createdAt)}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-white font-semibold">
          ${tx.totalUsdValue.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  if (!isLoading && transactions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
        <Header title="Activity" />
        <EmptyState
          icon="time-outline"
          title="No Activity Yet"
          description="Your transaction history will appear here after you make trades"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      <Header title="Activity" />

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.purpleHeart}
          />
        }
      />
    </SafeAreaView>
  );
}
