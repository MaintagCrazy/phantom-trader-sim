// BMO Wallet Send Token Screen
// Adapted from vinnyhoward/rn-crypto-wallet

import { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/styles/theme';
import CoinIcon from '@/components/CoinIcon';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useCoinsStore } from '@/store/coinsStore';
import { capitalizeFirstLetter } from '@/utils/capitalizeFirstLetter';
import { formatDollar } from '@/utils/formatDollars';
import Button from '@/components/Button/Button';

export default function SendPage() {
  const { send, toAddress: initialAddress } = useLocalSearchParams();
  const coinId = send as string;
  const toWalletAddress = initialAddress as string;

  const { portfolio } = usePortfolioStore();
  const { coins } = useCoinsStore();

  // Find the coin and holding
  const coin = useMemo(() => coins.find(c => c.id === coinId), [coins, coinId]);
  const holding = useMemo(
    () => portfolio?.holdings?.find(h => h.coinId === coinId),
    [portfolio, coinId]
  );

  const tokenBalance = holding?.amount || 0;
  const currentPrice = coin?.currentPrice || holding?.currentPrice || 0;
  const ticker = coin?.symbol?.toUpperCase() || holding?.symbol?.toUpperCase() || coinId.toUpperCase();
  const tokenName = coin?.name || holding?.name || coinId;
  const tokenImage = coin?.image || holding?.image;

  const [address, setAddress] = useState(toWalletAddress || '');
  const [amount, setAmount] = useState('');
  const [isAddressInputFocused, setIsAddressInputFocused] = useState(false);
  const [isAmountInputFocused, setIsAmountInputFocused] = useState(false);
  const [errors, setErrors] = useState<{ address?: string; amount?: string }>({});

  const usdAmount = useMemo(() => {
    if (!amount || isNaN(parseFloat(amount))) return 0;
    return parseFloat(amount) * currentPrice;
  }, [amount, currentPrice]);

  const handleNumericChange = (value: string) => {
    const numericValue = value
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*)\./g, '$1');
    setAmount(numericValue);
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: undefined }));
    }
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: undefined }));
    }
  };

  const handleMax = () => {
    setAmount(tokenBalance.toString());
  };

  const validateAndSubmit = () => {
    const newErrors: { address?: string; amount?: string } = {};

    if (!address || address.trim() === '') {
      newErrors.address = 'Recipient address is required';
    } else if (address.length < 10) {
      newErrors.address = 'Invalid address format';
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (parseFloat(amount) > tokenBalance) {
      newErrors.amount = 'Insufficient balance';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Navigate to confirmation screen
    router.push({
      pathname: '/token/send/send-confirmation',
      params: {
        address,
        amount,
        coinId,
        ticker,
        tokenName,
        currentPrice: currentPrice.toString(),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Token Icon */}
        <View style={styles.iconView}>
          <CoinIcon uri={tokenImage} symbol={ticker || '?'} size={64} />
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Address Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.addressInput,
                isAddressInputFocused && styles.inputFocused,
                errors.address && styles.inputError,
              ]}
              placeholder={`Recipient's ${capitalizeFirstLetter(tokenName)} address`}
              value={address}
              onChangeText={handleAddressChange}
              onFocus={() => setIsAddressInputFocused(true)}
              onBlur={() => setIsAddressInputFocused(false)}
              placeholderTextColor={Theme.colors.lightGrey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          </View>

          {/* Scan QR Button */}
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => router.push({ pathname: '/camera', params: { coinId } })}
          >
            <Ionicons name="qr-code-outline" size={20} color={Theme.colors.primary} />
            <Text style={styles.scanButtonText}>Scan QR Code</Text>
          </TouchableOpacity>

          {/* Amount Input */}
          <View style={styles.inputWrapper}>
            <View
              style={[
                styles.amountInputContainer,
                isAmountInputFocused && styles.inputFocused,
                errors.amount && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.amountInput}
                placeholder="Amount"
                value={amount}
                onChangeText={handleNumericChange}
                onFocus={() => setIsAmountInputFocused(true)}
                onBlur={() => setIsAmountInputFocused(false)}
                placeholderTextColor={Theme.colors.lightGrey}
                keyboardType="numeric"
                returnKeyType="done"
              />
              <View style={styles.amountDetails}>
                <Text style={styles.tickerText}>{ticker}</Text>
                <TouchableOpacity style={styles.maxButton} onPress={handleMax}>
                  <Text style={styles.maxButtonText}>Max</Text>
                </TouchableOpacity>
              </View>
            </View>
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          {/* Transaction Details */}
          <View style={styles.transactionDetails}>
            <Text style={styles.detailsText}>{formatDollar(usdAmount)}</Text>
            <Text style={styles.detailsText}>
              Available: {tokenBalance.toFixed(6)} {ticker}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonView}>
          <View style={styles.buttonContainer}>
            <Button
              backgroundColor={Theme.colors.lightDark}
              color={Theme.colors.white}
              onPress={() => router.back()}
              title="Cancel"
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              backgroundColor={Theme.colors.primary}
              onPress={validateAndSubmit}
              title="Next"
              linearGradient={Theme.colors.primaryLinearGradient}
            />
          </View>
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
    marginBottom: Theme.spacing.large,
    width: '100%',
  },
  tokenIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.title,
    fontWeight: '700',
  },
  formContainer: {
    flex: 1,
  },
  inputWrapper: {
    marginBottom: Theme.spacing.medium,
  },
  addressInput: {
    height: 60,
    backgroundColor: Theme.colors.lightDark,
    paddingHorizontal: Theme.spacing.medium,
    borderWidth: 1,
    borderColor: Theme.colors.grey,
    borderRadius: Theme.borderRadius.default,
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.large,
  },
  amountInputContainer: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.lightDark,
    borderWidth: 1,
    borderColor: Theme.colors.grey,
    borderRadius: Theme.borderRadius.default,
  },
  amountInput: {
    flex: 1,
    height: 60,
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.large,
    paddingHorizontal: Theme.spacing.medium,
  },
  inputFocused: {
    borderColor: Theme.colors.primary,
  },
  inputError: {
    borderColor: Theme.colors.accent,
  },
  errorText: {
    fontSize: Theme.fonts.sizes.normal,
    color: Theme.colors.accent,
    marginTop: Theme.spacing.tiny,
    marginLeft: Theme.spacing.small,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.small,
    marginBottom: Theme.spacing.medium,
  },
  scanButtonText: {
    color: Theme.colors.primary,
    fontSize: Theme.fonts.sizes.normal,
    marginLeft: Theme.spacing.small,
    fontWeight: '600',
  },
  amountDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerText: {
    fontWeight: '700',
    fontSize: Theme.fonts.sizes.large,
    color: Theme.colors.lightGrey,
    textAlign: 'center',
    marginRight: Theme.spacing.medium,
  },
  maxButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.small,
    paddingHorizontal: Theme.spacing.medium,
    borderRadius: Theme.borderRadius.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  maxButtonText: {
    fontWeight: '700',
    fontSize: Theme.fonts.sizes.normal,
    color: Theme.colors.white,
  },
  transactionDetails: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.dark,
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Theme.spacing.small,
  },
  detailsText: {
    fontSize: Theme.fonts.sizes.normal,
    color: Theme.colors.lightGrey,
  },
  buttonView: {
    marginTop: 'auto',
  },
  buttonContainer: {
    marginBottom: Theme.spacing.small,
  },
});
