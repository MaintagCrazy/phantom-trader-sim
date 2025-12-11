import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';

const QUICK_AMOUNTS = ['100', '500', '1000', '5000', '10000'];

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#131314' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
  placeholder: { width: 40 },
  content: { flex: 1, paddingHorizontal: 16 },
  illustration: { alignItems: 'center', paddingVertical: 40 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { color: 'white', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#8E8E93', textAlign: 'center', fontSize: 15, lineHeight: 22 },
  inputCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 24, marginBottom: 20 },
  inputLabel: { color: '#8E8E93', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dollarSign: { color: 'white', fontSize: 48, fontWeight: '700', marginRight: 4 },
  amountInput: { color: 'white', fontSize: 48, fontWeight: '700', minWidth: 120, textAlign: 'center' },
  quickBtns: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24, gap: 8 },
  quickBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, minWidth: 70, alignItems: 'center' },
  quickBtnActive: { backgroundColor: '#4E44CE' },
  quickBtnInactive: { backgroundColor: '#1C1C1E' },
  quickBtnText: { fontWeight: '600', fontSize: 14 },
  quickBtnTextActive: { color: 'white' },
  quickBtnTextInactive: { color: '#8E8E93' },
  infoBox: { backgroundColor: 'rgba(78, 68, 206, 0.15)', borderRadius: 12, padding: 16, marginBottom: 24 },
  infoText: { color: '#8E8E93', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  depositButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  depositButtonGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  depositButtonText: { color: 'white', fontSize: 18, fontWeight: '700' },
  depositButtonDisabled: { opacity: 0.5 },
  disclaimer: { color: '#636366', fontSize: 12, textAlign: 'center', marginTop: 8 },
});

export default function DepositScreen() {
  const router = useRouter();
  const { userId } = useUserStore();
  const { deposit, isLoading } = usePortfolioStore();
  const [amount, setAmount] = useState('');

  const handleDeposit = async () => {
    if (!userId) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    const success = await deposit(userId, amountNum);
    if (success) {
      Alert.alert('Success', `Deposited $${amountNum.toFixed(2)}`, [{ text: 'OK', onPress: () => router.back() }]);
    }
  };

  const isDisabled = !amount || parseFloat(amount) <= 0 || isLoading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Demo Funds</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.illustration}>
          <LinearGradient
            colors={['#4E44CE', '#6B5DD3']}
            style={styles.iconCircle}
          >
            <Ionicons name="wallet" size={48} color="white" />
          </LinearGradient>
          <Text style={styles.title}>Add Demo Funds</Text>
          <Text style={styles.subtitle}>
            This is simulated money for paper trading.{'\n'}Practice trading risk-free!
          </Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Enter Amount (USD)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#636366"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>
        </View>

        <View style={styles.quickBtns}>
          {QUICK_AMOUNTS.map((amt) => (
            <TouchableOpacity
              key={amt}
              onPress={() => setAmount(amt)}
              style={[styles.quickBtn, amount === amt ? styles.quickBtnActive : styles.quickBtnInactive]}
            >
              <Text style={[styles.quickBtnText, amount === amt ? styles.quickBtnTextActive : styles.quickBtnTextInactive]}>
                ${Number(amt).toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Demo funds are for practice only. No real money is involved.{'\n'}
            Learn to trade crypto without any financial risk.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleDeposit}
          disabled={isDisabled}
          style={[styles.depositButton, isDisabled && styles.depositButtonDisabled]}
        >
          <LinearGradient
            colors={['#4E44CE', '#6B5DD3']}
            style={styles.depositButtonGradient}
          >
            <Text style={styles.depositButtonText}>
              {isLoading ? 'Adding Funds...' : `Deposit $${Number(amount || 0).toLocaleString()}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          This is a demo account with simulated funds.
        </Text>
      </View>
    </SafeAreaView>
  );
}
