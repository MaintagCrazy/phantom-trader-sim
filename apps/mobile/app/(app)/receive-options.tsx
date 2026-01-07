// BMO Wallet Style Receive Options Modal
// Show wallet address / QR for receiving

import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Alert, Share } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import Theme from '@/styles/theme';
import { useCoinsStore, Coin } from '@/store/coinsStore';

// Simulated wallet addresses for demo
const DEMO_ADDRESSES: Record<string, string> = {
  bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  ethereum: '0x742d35Cc6634C0532925a3b844Bc9e7595f1e2',
  solana: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
};

export default function ReceiveOptionsScreen() {
  const { coins } = useCoinsStore();

  // Get top coins for receiving
  const topCoins = coins.slice(0, 10);

  const getAddress = (coinId: string) => {
    return DEMO_ADDRESSES[coinId] || `demo_${coinId}_address_12345`;
  };

  const handleCopyAddress = async (coinId: string, symbol: string) => {
    const address = getAddress(coinId);
    await Clipboard.setStringAsync(address);
    Alert.alert('Copied!', `${symbol.toUpperCase()} address copied to clipboard`);
  };

  const handleShare = async (coinId: string, symbol: string) => {
    const address = getAddress(coinId);
    try {
      await Share.share({
        message: `My ${symbol.toUpperCase()} address: ${address}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleSelectCoin = (coin: Coin) => {
    const address = getAddress(coin.id);
    Alert.alert(
      `Receive ${coin.symbol.toUpperCase()}`,
      `Your ${coin.name} address:\n\n${address.slice(0, 20)}...${address.slice(-10)}`,
      [
        { text: 'Copy', onPress: () => handleCopyAddress(coin.id, coin.symbol) },
        { text: 'Share', onPress: () => handleShare(coin.id, coin.symbol) },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const renderCoin = ({ item: coin }: { item: Coin }) => (
    <TouchableOpacity
      style={styles.coinItem}
      onPress={() => handleSelectCoin(coin)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: coin.image }} style={styles.coinIcon} />
      <View style={styles.coinInfo}>
        <Text style={styles.coinName}>{coin.name}</Text>
        <Text style={styles.coinSymbol}>{coin.symbol.toUpperCase()}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCopyAddress(coin.id, coin.symbol)}
        >
          <Ionicons name="copy-outline" size={20} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={20} color={Theme.colors.grey} />
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={Theme.colors.primaryLinearGradient} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>Choose a coin to receive</Text>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color={Theme.colors.primary} />
        <Text style={styles.infoText}>
          This is a demo app. Addresses shown are for illustration only.
        </Text>
      </View>

      {/* Coin List */}
      <FlatList
        data={topCoins}
        keyExtractor={(item) => item.id}
        renderItem={renderCoin}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    marginBottom: Theme.spacing.medium,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Theme.colors.primary}20`,
    marginHorizontal: Theme.spacing.medium,
    padding: Theme.spacing.medium,
    borderRadius: Theme.borderRadius.default,
    marginBottom: Theme.spacing.medium,
  },
  infoText: {
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.normal,
    marginLeft: Theme.spacing.small,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Theme.spacing.medium,
    paddingBottom: Theme.spacing.huge,
  },
  coinItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    backgroundColor: `${Theme.colors.dark}90`,
    borderRadius: Theme.borderRadius.large,
    marginBottom: Theme.spacing.small,
  },
  coinIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Theme.spacing.medium,
  },
  coinInfo: {
    flex: 1,
  },
  coinName: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.large,
    fontWeight: '600',
  },
  coinSymbol: {
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.normal,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: Theme.spacing.small,
    marginRight: Theme.spacing.small,
  },
});
