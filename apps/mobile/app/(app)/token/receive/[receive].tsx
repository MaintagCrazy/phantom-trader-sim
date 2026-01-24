// BMO Wallet Receive Token Screen
// Adapted from vinnyhoward/rn-crypto-wallet

import { useState, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  Platform,
  Dimensions,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import Theme from '@/styles/theme';
import { useUserStore } from '@/store/userStore';
import { capitalizeFirstLetter } from '@/utils/capitalizeFirstLetter';
import { truncateWalletAddress } from '@/utils/truncateWalletAddress';
import Button from '@/components/Button/Button';

const qrWidth = Dimensions.get('window').width * 0.7;
const qrContainerWidth = Dimensions.get('window').width * 0.85;

export default function ReceivePage() {
  const { receive } = useLocalSearchParams();
  const coinId = receive as string;
  const navigation = useNavigation();
  const { userId } = useUserStore();

  // Generate wallet address based on user ID and coin
  const walletAddress = useMemo(() => {
    const baseAddress = userId || 'user';
    // Generate address format
    const hash = `${baseAddress}-${coinId}`.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    return `0x${Math.abs(hash).toString(16).padStart(40, '0').slice(0, 40)}`;
  }, [userId, coinId]);

  const [buttonText, setButtonText] = useState('Copy');

  const handleCopy = async () => {
    await Clipboard.setStringAsync(walletAddress);
    setButtonText('Copied!');
    setTimeout(() => {
      setButtonText('Copy');
    }, 4000);
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: walletAddress,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `Receive ${capitalizeFirstLetter(coinId)}`,
    });
  }, [navigation, coinId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.qrContainer}>
          <QRCode
            value={walletAddress}
            size={qrWidth}
            backgroundColor={Theme.colors.white}
            color={Theme.colors.dark}
          />
        </View>

        <View style={styles.addressInputContainer}>
          <TextInput
            style={styles.addressInput}
            value={truncateWalletAddress(walletAddress, 10, 10)}
            editable={false}
            placeholderTextColor={Theme.colors.lightGrey}
          />
          <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
            <Text style={styles.copyButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.infoText}>
          Share this address to receive {capitalizeFirstLetter(coinId)}
        </Text>

        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Only send {capitalizeFirstLetter(coinId)} to this address. Sending other tokens may result in permanent loss.
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          backgroundColor={Theme.colors.primary}
          onPress={onShare}
          title="Share Address"
          linearGradient={Theme.colors.primaryLinearGradient}
        />
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.medium,
    marginTop: Platform.OS === 'android' ? Theme.spacing.huge : 0,
  },
  qrContainer: {
    width: qrContainerWidth,
    height: qrContainerWidth,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Theme.spacing.medium,
    backgroundColor: Theme.colors.white,
    padding: Theme.spacing.medium,
  },
  addressInputContainer: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.lightDark,
    borderWidth: 1,
    borderColor: Theme.colors.grey,
    borderRadius: Theme.borderRadius.default,
    width: '100%',
    marginTop: Theme.spacing.huge,
    overflow: 'hidden',
  },
  addressInput: {
    flex: 1,
    height: 60,
    color: Theme.colors.lightGrey,
    fontSize: Theme.fonts.sizes.large,
    paddingHorizontal: Theme.spacing.medium,
  },
  copyButton: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.medium,
    borderRadius: Theme.borderRadius.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
    minWidth: 80,
  },
  copyButtonText: {
    fontWeight: '700',
    fontSize: Theme.fonts.sizes.large,
    color: Theme.colors.white,
    textAlign: 'center',
  },
  infoText: {
    fontSize: Theme.fonts.sizes.large,
    color: Theme.colors.lightGrey,
    textAlign: 'center',
    marginTop: Theme.spacing.medium,
  },
  warningContainer: {
    backgroundColor: Theme.colors.lightDark,
    borderRadius: Theme.borderRadius.default,
    padding: Theme.spacing.medium,
    marginTop: Theme.spacing.large,
    width: '100%',
  },
  warningText: {
    fontSize: Theme.fonts.sizes.normal,
    color: Theme.colors.lightGrey,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: Theme.spacing.large,
    paddingBottom: Theme.spacing.large,
    paddingTop: Theme.spacing.small,
  },
});
