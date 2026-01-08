// BMO Wallet Style Send Options Modal
// Choose which asset to send

import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '@/styles/theme';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore } from '@/store/coinsStore';

export default function SendOptionsScreen() {
  const { portfolio } = usePortfolioStore();
  const { coins } = useCoinsStore();

  const holdings = portfolio?.holdings || [];

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSelectAsset = (coinId: string) => {
    // Navigate to the send form
    router.push(`/token/send/${coinId}`);
  };

  const renderAsset = ({ item }: { item: typeof holdings[0] }) => {
    const liveCoin = coins.find(c => c.id === item.coinId);
    const currentPrice = liveCoin?.currentPrice || item.currentPrice;
    const currentValue = item.amount * currentPrice;

    return (
      <TouchableOpacity
        style={styles.assetItem}
        onPress={() => handleSelectAsset(item.coinId)}
        activeOpacity={0.7}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.assetIcon} />
        ) : (
          <View style={[styles.assetIcon, styles.assetIconPlaceholder]}>
            <Text style={styles.assetIconText}>{item.symbol?.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.assetInfo}>
          <Text style={styles.assetName}>{item.name || item.coinId}</Text>
          <Text style={styles.assetAmount}>
            {item.amount.toFixed(4)} {item.symbol?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.assetValue}>
          <Text style={styles.valueText}>{formatCurrency(currentValue)}</Text>
          <Ionicons name="chevron-forward" size={20} color={Theme.colors.grey} />
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wallet-outline" size={64} color={Theme.colors.grey} />
      <Text style={styles.emptyTitle}>No Assets to Send</Text>
      <Text style={styles.emptySubtitle}>Buy some crypto first to send it</Text>
      <TouchableOpacity
        style={styles.buyButton}
        onPress={() => {
          router.back();
          router.push('/deposit');
        }}
      >
        <LinearGradient
          colors={Theme.colors.primaryLinearGradient}
          style={styles.buyButtonGradient}
        >
          <Text style={styles.buyButtonText}>Buy Crypto</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={Theme.colors.primaryLinearGradient} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>Choose an asset to send</Text>

      {/* Asset List */}
      <FlatList
        data={holdings}
        keyExtractor={(item) => item.coinId}
        renderItem={renderAsset}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={EmptyState}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.medium,
    paddingTop: 60,
    paddingBottom: Theme.spacing.small,
  },
  closeButton: {
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
  subtitle: {
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.large,
    textAlign: 'center',
    marginBottom: Theme.spacing.large,
  },
  listContent: {
    paddingHorizontal: Theme.spacing.medium,
    paddingBottom: Theme.spacing.huge,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    backgroundColor: `${Theme.colors.dark}90`,
    borderRadius: Theme.borderRadius.large,
    marginBottom: Theme.spacing.small,
  },
  assetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  assetValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.large,
    fontWeight: '500',
    marginRight: Theme.spacing.small,
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
    marginTop: Theme.spacing.small,
  },
  buyButton: {
    marginTop: Theme.spacing.large,
  },
  buyButtonGradient: {
    paddingHorizontal: Theme.spacing.huge,
    paddingVertical: Theme.spacing.medium,
    borderRadius: Theme.borderRadius.large,
  },
  buyButtonText: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.large,
    fontWeight: '700',
  },
});
