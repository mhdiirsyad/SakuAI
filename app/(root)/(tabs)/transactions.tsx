import TransactionRow from '@/components/transactionRow'
import { useDeleteTransaction } from '@/hooks/mutations/useTransactionMutation'
import { useAccountQuery } from '@/hooks/queries/useAccountQuery'
import { useTransactionQuery } from '@/hooks/queries/useTransactionQuery'
import { Transaction, TransactionType } from '@/lib/services/transaction'
import { exportTransactionsToCSV } from '@/lib/utils'
import { Feather } from '@expo/vector-icons'
import { eachDayOfInterval, format, startOfDay, startOfMonth } from 'date-fns'
import { useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { BarChart } from 'react-native-gifted-charts'
import { SafeAreaView } from 'react-native-safe-area-context'

// const FILTERS = ['All', 'Income', 'Expense'] as const
const FILTERS = [
  { key: 'All', label: 'Semua' },
  { key: 'Income', label: 'Pemasukan' },
  { key: 'Expense', label: 'Pengeluaran' }
]

const dayKey = (date: Date) => {
  return format(date, 'yyyy-MM-dd')
}

const currentMonthDays = () => {
  const today = startOfDay(new Date())
  return eachDayOfInterval({
    start: startOfMonth(today),
    end: today,
  }).map((d) => ({
    key: dayKey(d),
    label: format(d, 'd MMM')
  }))
}

export default function TransactionScreen() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]['key']>('All')
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)

  const typeFilter: TransactionType | null =
    activeFilter === 'Income' ? 'INCOME'
      : activeFilter === 'Expense' ? 'EXPENSE'
        : null

  const {
    data: transactions = [],
    isLoading: transactionLoading,
    isRefetching: transactionsRefetching,
    isError: transactionsError,
    refetch: refetchTransactions
  } = useTransactionQuery({
    accountId: activeAccountId,
    type: typeFilter
  })

  const { data: accounts = [], refetch: refetchAccounts } = useAccountQuery()
  const { mutateAsync: removeTransaction } = useDeleteTransaction()

  const loading = transactionLoading
  const error = transactionsError
  const refreshing = transactionsRefetching

  const loadData = () => {
    refetchTransactions()
    refetchAccounts()
  }

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)

    try {
      const { count } = await exportTransactionsToCSV(transactions)
      if (count === 0) {
        Alert.alert(
          "Tidak ada transaksi untuk diekspor",
          "Tidak ada transaksi dalam 30 hari terakhir untuk diekspor.",
        )
      }
    } catch (e) {
      console.error("Error exporting transactions:", e)
      Alert.alert(
        "Error",
        "Terjadi kesalahan saat mengekspor transaksi."
      )
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      "Hapus Transaksi",
      "Apakah Anda yakin ingin menghapus transaksi ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus", style: "destructive",
          onPress: async () => {
            const { error: removeError } = await removeTransaction(tx)
            if (removeError) {
              Alert.alert(
                "Gagal Menghapus Transaksi",
                "Terjadi kesalahan saat menghapus transaksi. Silakan coba lagi."
              )
            }
          }
        }
      ]
    )
  }

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return transactions

    return transactions.filter((tx) => {
      tx.category.toLowerCase().includes(q) ||
        tx.description?.toLowerCase().includes(q)
    })
  }, [transactions, search])

  const dailyIncomeExpense = useMemo(() => {
    const days = currentMonthDays()
    return days.flatMap(({ key, label }) => {
      const income = transactions.filter(
        (tx) => tx.type === 'INCOME' && dayKey(new Date(tx.date)) === key
      ).reduce((sum, tx) => sum + tx.amount, 0)
      const expense = transactions.filter(
        (tx) => tx.type === 'EXPENSE' && dayKey(new Date(tx.date)) === key
      ).reduce((sum, tx) => sum + tx.amount, 0)
      return [
        { value: income, label, frontColor: "#3DDC84" },
        { value: expense, label, frontColor: "#FF0000" }
      ]
    })
  }, [transactions])
  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={['top']}>
      <View className="pb-2 pt-3 px-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-brand-bg text-lg font-bold">
            Transaksi
          </Text>
          <TouchableOpacity
            onPress={handleExport}
            disabled={exporting}
            className="w-9 h-9 items-center justify-center rounded-full bg-white border border-brand-text-primary"
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#8A8D96" />
            ) : (
              <Feather name="download" size={15} color="#8A8D96" />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-2 border bg-white border-brand-text-primary rounded-xl px-3 py-1 mt-3">
          <Feather name="search" size={16} color="#8A8D96" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari transaksi"
            placeholderTextColor="#8A8D96"
            className="flex-1 text-sm text-brand-bg"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}
              className="w-5 h-5 items-center justify-center rounded-full bg-brand-body">
              <Feather name="x-circle" size={16} color="#8A8D96" />
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row items-center gap-2 mt-3">
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              className={`px-3 py-1 rounded-full border 
                ${activeFilter === filter.key ? 'bg-brand-surface border-brand-surface-border'
                  : 'bg-white border-brand-text-primary'}`
              }
            >
              <Text className={`text-sm font-medium ${activeFilter === filter.key ? 'text-white' : 'text-brand-text-secondary'}`}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row items-center gap-2 mt-3">
            <TouchableOpacity
              onPress={() => setActiveAccountId(null)}
              className={`px-3 py-1 rounded-full border 
              ${activeAccountId === null ? 'bg-brand-surface border-brand-surface-border'
                  : 'bg-white border-brand-text-primary'}`
              }
            >
              <Text className={`text-sm font-medium ${activeAccountId === null ? 'text-white' : 'text-brand-text-secondary'}`}>
                Semua Rekening
              </Text>
            </TouchableOpacity>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                onPress={() => setActiveAccountId(acc.id)}
                className={`px-3 py-1 rounded-full border 
                ${activeAccountId === acc.id ? 'bg-brand-surface border-brand-surface-border'
                    : 'bg-white border-brand-text-primary'}`
                }
              >
                <Text className={`text-sm font-medium ${activeAccountId === acc.id ? 'text-white' : 'text-brand-text-secondary'}`}>
                  {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8A8D96" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center">
          <Feather name="alert-triangle" size={48} color="#FF0000" />
          <Text className="text-brand-text-muted text-sm text-center mt-3">Transaksi Gagal Dimuat</Text>
          <TouchableOpacity
            onPress={() => loadData()}
            className="mt-3 px-4 py-2 bg-brand-surface rounded-full"
          >
            <Text className="text-white text-sm">Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (<TransactionRow tx={item} onDelete={() => handleDelete(item)} />)}
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingBottom: 20,
            paddingTop: 10
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-10">
              <Feather name="inbox" size={40} color="#8A8D96" />
              <Text className="text-brand-text-muted text-sm text-center mt-3">
                {search ? "Tidak ada transaksi yang cocok dengan pencarian Anda." : "Tidak ada transaksi untuk ditampilkan."}
              </Text>
            </View>
          }
          ListHeaderComponent={
            transactions.length > 0 ? (
              <View className='bg-white rounded-2xl border border-brand-text-primary p-3 mb-3'>
                <View className='flex-row items-center justify-between mb-2'>
                  <Text className='text-brand-bg font-semibold'>
                    Income vs Expense Harian
                  </Text>
                  <View className='flex-row items-center gap-3'>
                    <View className='flex-row items-center gap-1'>
                      <View className="w-2 h-2 rounded-full bg-brand-success" />
                      <Text className='text-brand-bg text-xs'>Income</Text>
                    </View>
                    <View className='flex-row items-center gap-1'>
                      <View className="w-2 h-2 rounded-full bg-brand-coral" />
                      <Text className='text-brand-bg text-xs'>Expense</Text>
                    </View>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <BarChart
                    data={dailyIncomeExpense}
                    width={Math.max(dailyIncomeExpense.length * 9, 280)}
                    height={120}
                    barWidth={4}
                    spacing={6}
                    hideYAxisText
                    xAxisColor="#E8E6DF"
                    yAxisColor="transparent"
                    rulesColor="#F0EEE7"
                    noOfSections={3}
                    xAxisLabelTextStyle={{ color: "#8A8D96", fontSize: 7 }}
                    isThreeD={false}
                    roundedTop
                  />
                </ScrollView>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  )
}