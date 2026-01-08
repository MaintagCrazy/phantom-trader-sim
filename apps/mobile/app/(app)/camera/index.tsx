// BMO Wallet Camera/QR Scanner Screen
// Adapted from vinnyhoward/rn-crypto-wallet

import { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/styles/theme';
import Button from '@/components/Button/Button';

export default function Camera() {
  const { coinId } = useLocalSearchParams();
  const coinIdParam = coinId as string;
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useFocusEffect(() => {
    setLoading(false);
  });

  if (!permission) {
    return <View style={styles.container} />;
  }

  const onBarcodeScanned = (data: BarcodeScanningResult) => {
    setLoading(true);
    if (!data || data.data === '') {
      return;
    }

    // Navigate to send screen with scanned address
    router.push({
      pathname: `/token/send/${coinIdParam || 'bitcoin'}`,
      params: {
        toAddress: data.data,
      },
    });
  };

  if (permission.status === 'denied') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="camera-outline" size={80} color={Theme.colors.white} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>Camera Access Denied</Text>
            <Text style={styles.subtitle}>
              To enable camera access, go to your device settings and allow
              camera access to scan QR codes for easy token transactions.
            </Text>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            loading={loading}
            onPress={!loading ? requestPermission : () => {}}
            title="Try Again"
            linearGradient={Theme.colors.primaryLinearGradient}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="camera-outline" size={80} color={Theme.colors.white} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>Allow Camera Access</Text>
            <Text style={styles.subtitle}>
              Allow camera access to quickly scan QR codes for easy token
              transactions.
            </Text>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            loading={loading}
            onPress={requestPermission}
            title="Enable Camera"
            linearGradient={Theme.colors.primaryLinearGradient}
          />
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CameraView
      style={styles.camera}
      barcodeScannerSettings={{
        barcodeTypes: ['qr'],
      }}
      onBarcodeScanned={(data: BarcodeScanningResult) =>
        loading ? undefined : onBarcodeScanned(data)
      }
    >
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Ionicons name="close" size={30} color={Theme.colors.white} />
      </TouchableOpacity>

      <View style={styles.scanFrame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      <Text style={styles.scanText}>Scan QR Code</Text>
    </CameraView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Theme.colors.primary,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Theme.spacing.large,
  },
  textContainer: {
    padding: Theme.spacing.large,
  },
  title: {
    fontWeight: '700',
    fontSize: 32,
    color: Theme.colors.white,
    marginBottom: Theme.spacing.small,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Theme.fonts.sizes.large,
    color: Theme.colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  buttonContainer: {
    paddingHorizontal: Theme.spacing.large,
    paddingBottom: Theme.spacing.large,
    paddingTop: Theme.spacing.small,
  },
  secondaryButton: {
    padding: 10,
    borderRadius: Theme.borderRadius.large,
    alignItems: 'center',
    height: 60,
    justifyContent: 'center',
    width: '100%',
    marginTop: Theme.spacing.small,
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: Theme.fonts.sizes.header,
    color: Theme.colors.white,
  },
  camera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Theme.colors.white,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanText: {
    color: Theme.colors.white,
    fontSize: Theme.fonts.sizes.large,
    marginTop: Theme.spacing.large,
    fontWeight: '600',
  },
});
