// BMO Wallet Send Confirmation Screen
// Adapted from vinnyhoward/rn-crypto-wallet

import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/styles/theme';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useUserStore } from '@/store/userStore';
import { formatDollar } from '@/utils/formatDollars';
import { truncateWalletAddress } from '@/utils/truncateWalletAddress';
import { capitalizeFirstLetter } from '@/utils/capitalizeFirstLetter';
import Button from '@/components/Button/Button';

export default function SendConfirmationPage() {
  const {
    address: toAddress,
    amount: tokenAmount,
    coinId,
    ticker,
    tokenName,
    currentPrice,
  } = useLocalSearchParams();

  const { userId } = useUserStore();
  const { sell, isLoading } = usePortfolioStore();

  const address = toAddress as string;
  const amount = parseFloat(tokenAmount as string);
  const price = parseFloat(currentPrice as string);
  const coinSymbol = ticker as string;
  const coinName = tokenName as string;
  const coinIdentifier = coinId as string;

  const usdValue = amount * price;
  const networkFee = 0.0001 * price; // Simulated network fee

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // In the simulator, we use the sell function to simulate sending
      // In a real app, this would call a blockchain transaction service
      const success = await sell(userId, coinIdentifier, amount);

      if (success) {
        // Navigate to success screen
        router.replace({
          pathname: '/(app)',
          params: {
            transactionSuccess: 'true',
            transactionType: 'send',
            amount: amount.toString(),
            ticker: coinSymbol,
          },
        });

        // Show success alert
        Alert.alert(
          'Transaction Sent',
          `Successfully sent ${amount} ${coinSymbol} to ${truncateWalletAddress(address)}`,
          [{ text: 'OK' }]
        );
      } else {
        setError('Transaction failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Icon */}
        <View style={styles.iconView}>
          <LinearGradient
            colors={Theme.colors.primaryLinearGradient}
            style={styles.iconBackground}
          >
            <Ionicons name="arrow-up" size={40} color={Theme.colors.white} />
          </LinearGradient>
        </View>

        {/* Amount */}
        <View style={styles.balanceContainer}>
          <Text style={styles.cryptoBalanceText}>
            {amount.toFixed(6)} {coinSymbol}
          </Text>
          <Text style={styles.usdBalanceText}>{formatDollar(usdValue)}</Text>
        </View>

        {/* Transaction Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>To</Text>
            <Text style={styles.detailValue}>
              {truncateWalletAddress(address, 8, 8)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network</Text>
            <Text style={styles.detailValue}>
              {capitalizeFirstLetter(coinName)} Mainnet
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Network Fee</Text>
            <Text style={styles.detailValue}>
              ~{formatDollar(networkFee)}
            </Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={[styles.detailValue, { fontWeight: '700' }]}>
              {formatDollar(usdValue + networkFee)}
            </Text>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorView}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Warning */}
        <View style={styles.warningContainer}>
          <Ionicons name="alert-circle-outline" size={20} color={Theme.colors.lightGrey} />
          <Text style={styles.warningText}>
            Please verify the recipient address. Transactions cannot be reversed.
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonView}>
        <View style={styles.buttonContainer}>
          <Button
            linearGradient={Theme.colors.primaryLinearGradient}
            loading={loading || isLoading}
            disabled={loading || isLoading}
            onPress={handleSend}
            title="Confirm & Send"
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            backgroundColor={Theme.colors.lightDark}
            color={Theme.colors.white}
            onPress={() => router.back()}
            title="Cancel"
            disabled={loading || isLoading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.dark,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: Theme.spacing.medium,
    marginTop: Platform.OS === 'android' ? Theme.spacing.huge : 0,
  },
  iconView: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.medium,
    width: '100%',
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: Theme.spacing.large,
  },
  cryptoBalanceText: {
    fontWeight: '700',
    fontSize: Theme.fonts.sizes.huge,
    color: Theme.colors.white,
    textAlign: 'center',
  },
  usdBalanceText: {
    fontWeight: '700',
    fontSize: Theme.fonts.sizes.title,
    color: Theme.colors.lightGrey,
    textAlign: 'center',
    marginTop: Theme.spacing.tiny,
  },
  detailsCard: {
    backgroundColor: Theme.colors.lightDark,
    borderRadius: Theme.borderRadius.large,
    padding: Theme.spacing.medium,
    marginBottom: Theme.spacing.medium,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.grey,
  },
  detailLabel: {
    fontSize: Theme.fonts.sizes.normal,
    color: Theme.colors.lightGrey,
  },
  detailValue: {
    fontSize: Theme.fonts.sizes.normal,
    color: Theme.colors.white,
  },
  errorView: {
    backgroundColor: `${Theme.colors.accent}20`,
    borderRadius: Theme.borderRadius.default,
    padding: Theme.spacing.medium,
    marginBottom: Theme.spacing.medium,
  },
  errorText: {
    fontSize: Theme.fonts.sizes.normal,
    color: Theme.colors.accent,
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.lightDark,
    borderRadius: Theme.borderRadius.default,
    padding: Theme.spacing.medium,
    marginTop: 'auto',
    marginBottom: Theme.spacing.medium,
  },
  warningText: {
    flex: 1,
    fontSize: Theme.fonts.sizes.small,
    color: Theme.colors.lightGrey,
    marginLeft: Theme.spacing.small,
  },
  buttonView: {
    padding: Theme.spacing.medium,
    paddingBottom: Platform.OS === 'ios' ? Theme.spacing.large : Theme.spacing.medium,
  },
  buttonContainer: {
    marginBottom: Theme.spacing.small,
  },
});
