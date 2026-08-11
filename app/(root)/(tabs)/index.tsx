import BudgetModal from '@/components/budgetModal';
import TransactionRow from '@/components/transactionRow';
import { getCategoryConfig } from '@/constants/category';
import { useAccountQuery } from '@/hooks/queries/useAccountQuery';
import { useBudgetQuery } from '@/hooks/queries/useBudgetQuery';
import { useTransactionQuery } from '@/hooks/queries/useTransactionQuery';
import { Transaction } from '@/lib/services/transaction';
import { formatPrice } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import { useUser } from '@clerk/expo';
import { Feather, Ionicons } from '@expo/vector-icons';
import { isSameMonth } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { RefreshControl, ScrollView } from 'react-native-gesture-handler';
import { PieChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

const QUICK_ACTIONS = [
  {
    icon: "camera",
    label: "AI Receipt Scan",
    action: "scan",
    color: "#1A85FF",
  },
  {
    icon: "mic",
    label: "Voice Entry",
    action: "voice",
    color: "#FF6B4A",
  },
  {
    icon: "plus",
    label: "Add Manually",
    action: "manual",
    color: "#3DDC84",
  },
] as const;

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Selamat pagi"
  if (hour < 18) return "Selamat afternoon"
  return "Selamat malam"
}

export default function HomeScreen() {
  const { user } = useUser()
  const router = useRouter()
  const currency = useUserStore((state) => state.currency)

  const [budgetModalOpen, setBudgetModalOpen] = useState(false)

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    isRefetching: accountsRefetching,
    refetch: refetchAccounts,
  } = useAccountQuery()

  const {
    data: transactions = [],
    isLoading: transactionLoading,
    isRefetching: transactionRefetching,
    refetch: refetchTransactions,
  } = useTransactionQuery()

  const {
    data: budget = null,
    refetch: refetchBudget,
  } = useBudgetQuery()

  const loading = accountsLoading || transactionLoading
  const refreshing = accountsRefetching || transactionRefetching

  const onRefresh = () => {
    refetchAccounts()
    refetchTransactions()
    refetchBudget()
  }

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts]
  )

  const monthlyTransactions = useMemo(() => {
    const now = new Date()
    return transactions.filter((tx) => isSameMonth(new Date(tx.date), now))
  }, [transactions])

  const monthlyIncomes = useMemo(
    () => monthlyTransactions
      .filter((tx) => tx.type === 'INCOME')
      .reduce((sum, tx) => sum + tx.amount, 0),
    [monthlyTransactions]
  )

  const monthlyExpenses = useMemo(
    () => monthlyTransactions
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + tx.amount, 0),
    [monthlyTransactions]
  )

  const recentTransactions = useMemo(
    () => transactions.slice(0, 5),
    [transactions]
  )

  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    monthlyTransactions
      .filter((tx) => tx.type === 'EXPENSE')
      .forEach((tx) => {
        map[tx.category] = (map[tx.category] ?? 0) + tx.amount
      })

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category: category as Transaction['category'],
        amount,
        color: getCategoryConfig(category as Transaction['category']).color,
      }))
  }, [monthlyTransactions])
  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={['top']}>
      <ScrollView
        className="flex-1 bg-brand-body"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="bg-brand-bg rounded-b-xl px-5 pt-5 pb-6">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-3xl font-bold text-brand-text-primary">
              SAKUAI
            </Text>
            <View className="flex-row items-center gap-2.5">
              <View className="items-end">
                <Text className="text-brand-text-primary text-sm">
                  {getGreeting()}
                </Text>
                <Text className="text-brand-text-primary text-lg font-bold">
                  {user?.firstName?.split(" ")[0]}
                </Text>
              </View>
              <TouchableOpacity
                className="w-10 h-10 rounded-full bg-brand-text-muted items-center justify-center overflow-hidden"
                onPress={() => router.push('/(root)/(tabs)/profile')}
              >
                {user?.imageUrl && user.hasImage ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Feather name='user' size={20} color="#8A8D96" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-brand-text-secondary text-sm">
              Total Saldo
            </Text>
            <Text className="text-brand-text-primary text-4xl font-bold">
              {formatPrice(totalBalance, currency)}
            </Text>
            <View className="flex-row gap-3 mt-2">
              <View className="flex-row items-center gap-1">
                <Feather name='arrow-up-right' size={16} color="#3DDC84" />
                <Text className="text-brand-success text-sm">
                  {formatPrice(monthlyIncomes, currency)}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Feather name='arrow-up-right' size={16} color="#FF6B6B" />
                <Text className="text-brand-coral text-sm">
                  {formatPrice(monthlyExpenses, currency)}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={() => router.push({
                  pathname: '/(root)/(tabs)/add-transaction',
                  params: { action: action.action }
                })}
                activeOpacity={0.7}
                className="flex-1 items-center justify-center bg-brand-surface rounded-xl py-3 border border-brand-surface-border gap-2"
              >
                <View className="rounded-full w-9 h-9 items-center justify-center" style={{ backgroundColor: action.color + "33" }}>
                  <Feather name={action.icon} size={20} color={action.color} />
                </View>
                <Text className="text-brand-text-primary text-xs mt-1 font-medium text-center">
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-5 pt-4 pb-5">
          <TouchableOpacity
            onPress={() => router.push('/(root)/(tabs)/assistant')}
            className="bg-white rounded-xl p-3 border border-brand-text-primary flex-row items-center justify-between"
          >
            <View className="items-center justify-center w-8 h-8 rounded-full bg-blue-200">
              <Ionicons name="sparkles-outline" size={16} color="#1A85FF" />
            </View>
            <Text className="text-brand-text-secondary text-sm font-medium flex-1 mx-3">
              Tanya AI untuk saran keuanganmu
            </Text>
            <Feather name="arrow-right" size={16} color="#1A85FF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setBudgetModalOpen(true)}
            className="bg-white rounded-xl p-4 border border-brand-text-primary justify-between mt-3"
          >
            <View className="flex-1 items-center flex-row justify-between mb-2">
              <Text className="text-brand-surface text-lg font-bold">
                Monthly Budget
              </Text>
              <Feather name="edit-3" size={16} color="#1A85FF" className="ml-2" />
            </View>

            {budget ? (
              <>
                <Text className="text-brand-text-secondary text-sm font-medium">
                  {formatPrice(monthlyExpenses, currency)} / {formatPrice(budget.amount, currency)}
                </Text>
                <View
                  className="h-2 rounded-full overflow-hidden bg-gray-200 mt-1"
                >
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(Math.round((monthlyExpenses / budget.amount) * 100), 100)}%`,
                      backgroundColor: monthlyExpenses >= budget.amount ?
                        "#FF6B6B" : monthlyExpenses >= budget.amount * 0.7 ?
                          "#FFD700" : "#3DDC84"
                    }}
                  />
                </View>
              </>
            ) : (
              <Text className="text-brand-text-secondary text-sm font-medium">
                Tap untuk menambahkan budget bulananmu
              </Text>
            )}
          </TouchableOpacity>

          {expenseBreakdown.length > 0 && (
            <View className="bg-white rounded-xl p-4 border border-brand-text-primary mt-3">
              <Text className="text-brand-surface text-lg font-bold mb-2">
                Detail Pengeluaran (bulan ini)
              </Text>

              <View className="flex-row flex-wrap gap-3">
                <PieChart
                  data={expenseBreakdown.map((item) => ({
                    value: item.amount,
                    color: item.color
                  }))}
                  radius={60}
                  innerRadius={40}
                  innerCircleBorderColor={"#fff"}
                />

                <View className="flex-1 justify-center gap-1.5">
                  {expenseBreakdown.slice(0, 6).map((item) => (
                    <View key={item.category} className="flex-row items-center justify-between gap-2">
                      <View className="flex-row items-center gap-2">
                        <View className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <Text className="text-brand-surface text-sm font-medium">
                          {getCategoryConfig(item.category).label}
                        </Text>
                      </View>
                      <Text className="text-brand-surface text-sm font-bold">
                        {formatPrice(item.amount, currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View className="flex-row items-center justify-between mt-3 mb-2 px-3">
            <Text className="text-brand-surface text-lg font-bold">
              Transaksi terbaru
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(root)/(tabs)/transactions')}
            >
              <Text className="text-brand-primary text-sm font-medium">
                Lihat semua
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center py-10">
              <ActivityIndicator size="large" color="#1A1D26" />
            </View>
          ) : recentTransactions.length === 0 ? (
            <View className="flex-1 items-center justify-center py-10">
              <Feather name="inbox" size={40} color="#8A8D96" />
              <Text className="text-brand-text-secondary text-sm mt-2">
                Belum ada transaksi
              </Text>
            </View>
          ) : (
            recentTransactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))
          )}
        </View>
      </ScrollView>

      {user && (
        <BudgetModal
          visible={budgetModalOpen}
          budget={budget}
          onClose={() => setBudgetModalOpen(false)}
          onSaved={() => {
            setBudgetModalOpen(false)
            refetchBudget()
          }}
        />
      )}
    </SafeAreaView>
  )
}