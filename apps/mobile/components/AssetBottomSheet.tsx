// BMO Wallet Style Asset Bottom Sheet
// Draggable sheet showing crypto holdings

import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import BottomSheet, { BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '@/styles/theme';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore, Coin } from '@/store/coinsStore';
import { Holding } from '@/services/api';

interface AssetBottomSheetProps {
  onTokenPress?: (coinId: string) => void;
}

const AssetBottomSheet = forwardRef<BottomSheet, AssetBottomSheetProps>(
  ({ onTokenPress }, ref) => {
    const { portfolio } = usePortfolioStore();
    const { coins } = useCoinsStore();

    const holdings = portfolio?.holdings || [];
    const cashBalance = portfolio?.cashBalance || 0;

    // Snap points for the bottom sheet
    const snapPoints = useMemo(() => ['12%', '35%', '70%', '90%'], []);

    const handleTokenPress = useCallback((coinId: string) => {
      if (onTokenPress) {
        onTokenPress(coinId);
      } else {
        router.push(`/token/${coinId}`);
      }
    }, [onTokenPress]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={1}
          appearsOnIndex={2}
          opacity={0.5}
        />
      ),
      []
    );

    const formatCurrency = (value: number) => {
      return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const renderAssetItem = useCallback(({ item: holding }: { item: Holding }) => {
      const liveCoin = coins.find(c => c.id === holding.coinId);
      const currentPrice = liveCoin?.currentPrice || holding.currentPrice;
      const currentValue = holding.amount * currentPrice;
      const priceChange = liveCoin?.priceChange24h || 0;
      const isPositive = priceChange >= 0;

      return (
        <TouchableOpacity
          style={styles.assetCard}
          onPress={() => handleTokenPress(holding.coinId)}
          activeOpacity={0.7}
        >
          <View style={styles.assetLeft}>
            {holding.image ? (
              <Image source={{ uri: holding.image }} style={styles.assetIcon} />
            ) : (
              <View style={[styles.assetIcon, styles.assetIconPlaceholder]}>
                <Text style={styles.assetIconText}>
                  {holding.symbol?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.assetInfo}>
              <Text style={styles.assetName}>{holding.name || holding.coinId}</Text>
              <Text style={styles.assetAmount}>
                {holding.amount.toFixed(4)} {holding.symbol?.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.assetRight}>
            <Text style={styles.assetValue}>{formatCurrency(currentValue)}</Text>
            <View style={styles.changeContainer}>
              <Ionicons
                name={isPositive ? 'arrow-up' : 'arrow-down'}
                size={12}
                color={isPositive ? Theme.colors.success : Theme.colors.accent}
              />
              <Text
                style={[
                  styles.changeText,
                  { color: isPositive ? Theme.colors.success : Theme.colors.accent },
                ]}
              >
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }, [coins, handleTokenPress]);

    const ListHeaderComponent = useCallback(() => (
      <View style={styles.headerContainer}>
        <View style={styles.handle} />
        <Text style={styles.sectionTitle}>Assets</Text>

        {/* Cash Balance Card */}
        {cashBalance > 0 && (
          <View style={styles.cashCard}>
            <View style={styles.assetLeft}>
              <LinearGradient
                colors={[Theme.colors.success, '#1B8B4A']}
                style={styles.cashIcon}
              >
                <Text style={styles.cashIconText}>$</Text>
              </LinearGradient>
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>USD Cash</Text>
                <Text style={styles.assetAmount}>Available to trade</Text>
              </View>
            </View>
            <Text style={styles.assetValue}>{formatCurrency(cashBalance)}</Text>
          </View>
        )}

        {holdings.length > 0 && (
          <Text style={styles.holdingsTitle}>Your Holdings</Text>
        )}
      </View>
    ), [cashBalance, holdings.length]);

    const ListEmptyComponent = useCallback(() => (
      <View style={styles.emptyContainer}>
        <Ionicons name="wallet-outline" size={48} color={Theme.colors.grey} />
        <Text style={styles.emptyText}>No assets yet</Text>
        <Text style={styles.emptySubtext}>Buy crypto to see your holdings here</Text>
      </View>
    ), []);

    return (
      <BottomSheet
        ref={ref}
        index={1}
        snapPoints={snapPoints}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={false}
      >
        <BottomSheetFlatList
          data={holdings}
          keyExtractor={(item: Holding) => item.coinId}
          renderItem={renderAssetItem}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheet>
    );
  }
);

AssetBottomSheet.displayName = 'AssetBottomSheet';

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: Theme.colors.dark,
    borderTopLeftRadius: Theme.borderRadius.extraLarge,
    borderTopRightRadius: Theme.borderRadius.extraLarge,
  },
  handleIndicator: {
    backgroundColor: Theme.colors.grey,
    width: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Theme.colors.grey,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Theme.spacing.medium,
  },
  headerContainer: {
    paddingHorizontal: Theme.spacing.medium,
    paddingBottom: Theme.spacing.small,
  },
  sectionTitle: {
    fontSize: Theme.fonts.sizes.title,
    fontWeight: '700',
    color: Theme.colors.white,
    marginBottom: Theme.spacing.medium,
  },
  holdingsTitle: {
    fontSize: Theme.fonts.sizes.large,
    fontWeight: '600',
    color: Theme.colors.lightGrey,
    marginTop: Theme.spacing.medium,
    marginBottom: Theme.spacing.small,
  },
  listContent: {
    paddingHorizontal: Theme.spacing.medium,
    paddingBottom: Theme.spacing.huge,
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.lightDark,
  },
  cashCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.lightDark,
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Theme.spacing.medium,
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
    fontSize: Theme.fonts.sizes.large,
    fontWeight: '600',
    color: Theme.colors.white,
  },
  assetAmount: {
    fontSize: Theme.fonts.sizes.normal,
    color: Theme.colors.lightGrey,
    marginTop: 2,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetValue: {
    fontSize: Theme.fonts.sizes.large,
    fontWeight: '600',
    color: Theme.colors.white,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  changeText: {
    fontSize: Theme.fonts.sizes.small,
    marginLeft: 2,
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
  },
});

export default AssetBottomSheet;
