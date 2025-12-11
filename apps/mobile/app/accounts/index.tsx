import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/store/userStore';
import { useAccountsStore, Account } from '@/store/accountsStore';
import { usePortfolioStore } from '@/store/portfolioStore';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#131314',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  accountCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountCardActive: {
    borderWidth: 2,
    borderColor: '#4E44CE',
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4E44CE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountIconText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountBalance: {
    color: '#8E8E93',
    fontSize: 14,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 68, 206, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    color: '#4E44CE',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  moreBtn: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#2C2D30',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#2C2D30',
  },
  modalButtonConfirm: {
    backgroundColor: '#4E44CE',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function AccountsScreen() {
  const router = useRouter();
  const { userId } = useUserStore();
  const { accounts, activeAccount, isLoading, fetchAccounts, createAccount, switchAccount, renameAccount, deleteAccount, migrateToAccounts } = useAccountsStore();
  const { fetchPortfolio } = usePortfolioStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountName, setAccountName] = useState('');

  useEffect(() => {
    if (userId) {
      // First migrate if needed, then fetch accounts
      migrateToAccounts(userId).then(() => {
        fetchAccounts(userId);
      });
    }
  }, [userId]);

  const handleSwitchAccount = async (account: Account) => {
    if (!userId || account.isActive) return;

    const success = await switchAccount(userId, account.id);
    if (success) {
      // Refresh portfolio for new active account
      await fetchPortfolio(userId);
    }
  };

  const handleCreateAccount = async () => {
    if (!userId || !accountName.trim()) return;

    const success = await createAccount(userId, accountName.trim());
    if (success) {
      setShowCreateModal(false);
      setAccountName('');
      // Refresh portfolio for new account
      await fetchPortfolio(userId);
    }
  };

  const handleRenameAccount = async () => {
    if (!userId || !selectedAccount || !accountName.trim()) return;

    const success = await renameAccount(userId, selectedAccount.id, accountName.trim());
    if (success) {
      setShowRenameModal(false);
      setSelectedAccount(null);
      setAccountName('');
    }
  };

  const handleDeleteAccount = (account: Account) => {
    if (!userId) return;

    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account.name}"? This will delete all holdings and transaction history for this account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteAccount(userId, account.id);
            if (success) {
              // Refresh portfolio if deleted account was active
              await fetchPortfolio(userId);
            }
          },
        },
      ]
    );
  };

  const showAccountOptions = (account: Account) => {
    Alert.alert(
      account.name,
      '',
      [
        {
          text: 'Rename',
          onPress: () => {
            setSelectedAccount(account);
            setAccountName(account.name);
            setShowRenameModal(true);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteAccount(account),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getAccountInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (isLoading && accounts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Accounts</Text>
          <View style={styles.addBtn} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4E44CE" />
          <Text style={styles.loadingText}>Loading accounts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accounts</Text>
        <TouchableOpacity
          onPress={() => {
            setAccountName('');
            setShowCreateModal(true);
          }}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={28} color="#4E44CE" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Your Accounts</Text>

        {accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color="#636366" />
            <Text style={styles.emptyText}>No accounts yet</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                setAccountName('');
                setShowCreateModal(true);
              }}
            >
              <LinearGradient
                colors={['#4E44CE', '#6B5DD3']}
                style={styles.createButtonGradient}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.createButtonText}>Create Account</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          accounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={[styles.accountCard, account.isActive && styles.accountCardActive]}
              onPress={() => handleSwitchAccount(account)}
              onLongPress={() => showAccountOptions(account)}
            >
              <View style={styles.accountIcon}>
                <Text style={styles.accountIconText}>{getAccountInitial(account.name)}</Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountBalance}>
                  {formatCurrency(account.portfolioValue)}
                  {account.holdingsCount > 0 && ` · ${account.holdingsCount} assets`}
                </Text>
              </View>
              {account.isActive ? (
                <View style={styles.activeIndicator}>
                  <Ionicons name="checkmark-circle" size={14} color="#4E44CE" />
                  <Text style={styles.activeText}>Active</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.moreBtn}
                  onPress={() => showAccountOptions(account)}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Create Account Modal */}
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Account</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Account name"
              placeholderTextColor="#636366"
              value={accountName}
              onChangeText={setAccountName}
              autoFocus
              maxLength={50}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowCreateModal(false);
                  setAccountName('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleCreateAccount}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Rename Account Modal */}
      {showRenameModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Account</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Account name"
              placeholderTextColor="#636366"
              value={accountName}
              onChangeText={setAccountName}
              autoFocus
              maxLength={50}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowRenameModal(false);
                  setSelectedAccount(null);
                  setAccountName('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleRenameAccount}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
