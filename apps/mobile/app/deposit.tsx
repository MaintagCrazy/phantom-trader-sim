import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '@/components/ActionButton';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import colors from '@/constants/colors';

const QUICK_AMOUNTS = ['100', '500', '1000', '5000'];

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.darkBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '600' },
  placeholder: { width: 40 },
  content: { flex: 1, paddingHorizontal: 16 },
  illustration: { alignItems: 'center', paddingVertical: 48 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.purpleDark, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { color: colors.white, fontSize: 20, fontWeight: '600', marginBottom: 8 },
  subtitle: { color: colors.gray, textAlign: 'center' },
  inputCard: { backgroundColor: colors.cardBg, borderRadius: 16, padding: 24, marginBottom: 24 },
  inputLabel: { color: colors.gray, fontSize: 14, marginBottom: 8, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dollarSign: { color: colors.white, fontSize: 36, fontWeight: '700', marginRight: 8 },
  amountInput: { color: colors.white, fontSize: 36, fontWeight: '700', minWidth: 100, textAlign: 'center' },
  quickBtns: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  quickBtn: { flex: 1, marginHorizontal: 4, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  quickBtnActive: { backgroundColor: colors.purpleHeart },
  quickBtnInactive: { backgroundColor: colors.cardBg },
  quickBtnText: { fontWeight: '600' },
  quickBtnTextActive: { color: colors.white },
  quickBtnTextInactive: { color: colors.gray },
  disclaimer: { color: colors.gray, fontSize: 12, textAlign: 'center', marginTop: 24 },
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Demo Funds</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.illustration}>
          <View style={styles.iconCircle}>
            <Ionicons name="wallet" size={48} color={colors.purpleLight} />
          </View>
          <Text style={styles.title}>Add Demo Funds</Text>
          <Text style={styles.subtitle}>This is fake money for paper trading.{'\n'}Practice trading risk-free!</Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Amount (USD)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput style={styles.amountInput} placeholder="0" placeholderTextColor={colors.gray} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} autoFocus />
          </View>
        </View>

        <View style={styles.quickBtns}>
          {QUICK_AMOUNTS.map((amt) => (
            <TouchableOpacity key={amt} onPress={() => setAmount(amt)} style={[styles.quickBtn, amount === amt ? styles.quickBtnActive : styles.quickBtnInactive]}>
              <Text style={[styles.quickBtnText, amount === amt ? styles.quickBtnTextActive : styles.quickBtnTextInactive]}>${amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ActionButton title={isLoading ? 'Adding Funds...' : `Deposit $${amount || '0'}`} onPress={handleDeposit} fullWidth size="large" disabled={!amount || parseFloat(amount) <= 0 || isLoading} loading={isLoading} />
        <Text style={styles.disclaimer}>This is a demo account with simulated funds.{'\n'}Real cryptocurrency is not involved.</Text>
      </View>
    </SafeAreaView>
  );
}
