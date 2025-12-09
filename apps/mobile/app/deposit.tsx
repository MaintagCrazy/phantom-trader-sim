import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ActionButton from '@/components/ActionButton';
import { useUserStore } from '@/store/userStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import colors from '@/constants/colors';

const QUICK_AMOUNTS = ['100', '500', '1000', '5000'];

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
      Alert.alert('Success', `Deposited $${amountNum.toFixed(2)}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <Ionicons name="close" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Add Demo Funds</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 px-4">
        {/* Illustration */}
        <View className="items-center py-12">
          <View className="w-24 h-24 rounded-full bg-purple-dark items-center justify-center mb-6">
            <Ionicons name="wallet" size={48} color={colors.purpleLight} />
          </View>
          <Text className="text-white text-xl font-semibold mb-2">
            Add Demo Funds
          </Text>
          <Text className="text-gray-400 text-center">
            This is fake money for paper trading.{'\n'}
            Practice trading risk-free!
          </Text>
        </View>

        {/* Amount Input */}
        <View className="bg-card-bg rounded-2xl p-6 mb-6">
          <Text className="text-gray-400 text-sm mb-2 text-center">Amount (USD)</Text>
          <View className="flex-row items-center justify-center">
            <Text className="text-white text-4xl font-bold mr-2">$</Text>
            <TextInput
              className="text-white text-4xl font-bold min-w-[100px] text-center"
              placeholder="0"
              placeholderTextColor={colors.gray}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>
        </View>

        {/* Quick Amount Buttons */}
        <View className="flex-row justify-between mb-8">
          {QUICK_AMOUNTS.map((amt) => (
            <TouchableOpacity
              key={amt}
              onPress={() => setAmount(amt)}
              className={`flex-1 mx-1 py-3 rounded-xl items-center ${
                amount === amt ? 'bg-purple-heart' : 'bg-card-bg'
              }`}
            >
              <Text
                className={`font-semibold ${
                  amount === amt ? 'text-white' : 'text-gray-400'
                }`}
              >
                ${amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Deposit Button */}
        <ActionButton
          title={isLoading ? 'Adding Funds...' : `Deposit $${amount || '0'}`}
          onPress={handleDeposit}
          fullWidth
          size="large"
          disabled={!amount || parseFloat(amount) <= 0 || isLoading}
          loading={isLoading}
        />

        {/* Disclaimer */}
        <Text className="text-gray-400 text-xs text-center mt-6">
          This is a demo account with simulated funds.{'\n'}
          Real cryptocurrency is not involved.
        </Text>
      </View>
    </SafeAreaView>
  );
}
