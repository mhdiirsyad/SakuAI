import AIActionCard from '@/components/aiActionCard'
import DatePicker from '@/components/datePicker'
import PillGroup from '@/components/pillGroup'
import ScannerModal from '@/components/scannerModal'
import VoiceRecorderModal from '@/components/voiceRecorderModal'
import { CategoryKey, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/category'
import { AI_GRADIENT, AI_GRADIENT_REVERSE } from '@/constants/theme'
import { useInsertTransaction } from '@/hooks/mutations/useTransactionMutation'
import { useAccountQuery } from '@/hooks/queries/useAccountQuery'
import { TransactionFormSchema, transactionSchema } from '@/lib/schemas/transaction'
import { Account } from '@/lib/services/account'
import { ExtractedTransaction, extractFromReciept } from '@/lib/services/extractTransaction'
import { InputMethod } from '@/lib/services/transaction'
import { useUser } from '@clerk/expo'
import { Feather } from '@expo/vector-icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, isValid } from 'date-fns'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'

const DEFAULT_VALUES = (accounts: Account[]): TransactionFormSchema => ({
  type: "EXPENSE",
  amount: "",
  category: "food",
  accountId: accounts[0]?.id ?? "",
  description: "",
  date: new Date()
})

const TYPE_OPTIONS = [
  { key: "EXPENSE" as const, label: "Pengeluaran" },
  { key: "INCOME" as const, label: "Pemasukan" }
]

export default function AddTransactionScreen() {
  const { user } = useUser()
  const router = useRouter()
  const params = useLocalSearchParams<{ action?: string }>()

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    isError: accountsError,
  } = useAccountQuery()

  const {
    mutateAsync: createTransaction,
    isPending: savingTransaction,
  } = useInsertTransaction()

  const [error, setError] = useState("")
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [inputMethod, setInputMethod] = useState<InputMethod>("MANUAL")
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset: resetForm,
    formState: { errors }
  } = useForm<TransactionFormSchema>({
    resolver: zodResolver(transactionSchema),
    mode: "onBlur",
    defaultValues: DEFAULT_VALUES([])
  })

  const type = watch("type")
  const category = watch("category")
  const accountId = watch("accountId")
  const date = watch("date")

  const CATEGORIES = type === "EXPENSE" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  async function onSubmit(values: TransactionFormSchema) {
    if (!user) return;

    setError("")
    const parsed = parseFloat(values.amount.replace(/,/g, ''))
    const { error: createError} = await createTransaction({
      account_id: values.accountId,
      amount: parsed,
      category: values.category,
      date: values.date.toISOString(),
      description: values.description?.trim() || null,
      type: values.type,
      input_method: inputMethod,
      user_id: user.id,
      voice_transcript: inputMethod === "VOICE" ? voiceTranscript : null
    })

    if(createError) {
      setError("Gagal menyimpan transaksi. Silakan coba lagi.")
      return;
    }

    resetForm(DEFAULT_VALUES(accounts))
    setVoiceTranscript(null)
    setInputMethod("MANUAL")

    if(router.canGoBack()) {
      router.back()
    } else {
      router.replace("/(root)/(tabs)/transactions")
    }
  }

  const applyExtraction = (extracted: ExtractedTransaction) => {
    const categories = extracted.type === "EXPENSE" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

    const isValidCategory = (key: CategoryKey | null): key is CategoryKey => 
      !!key && categories.some((c) => c.key === key)

    if(extracted.type) setValue("type", extracted.type);
    if(isValidCategory(extracted.category)) setValue("category", extracted.category);
    if(extracted.amount) setValue("amount", String(extracted.amount));
    if(extracted.description) setValue("description", extracted.description);
    if(extracted.date) {
      const parsedDate = new Date(extracted.date);
      if(isValid(parsedDate) && parsedDate <= new Date()) {
        setValue("date", parsedDate);
      }
    }

    const missing = [
      extracted.amount === null && "amount",
      !isValidCategory(extracted.category) && "category",
    ].filter(Boolean);
    if (missing.length > 0) {
      Alert.alert(
        "Informasi",
        `Beberapa informasi tidak dapat diekstraksi dari struk: ${missing.join(", ")}. Silakan lengkapi secara manual.`,
        [{ text: "OK" }]
      );
    }
  }

  const handleRecieptCaptured = async (base64: string, mimeType: string) => {
    setScannerOpen(false);
    setScanning(true);

    try {
      const extracted = await extractFromReciept(base64, mimeType);
      applyExtraction(extracted);
      setInputMethod("RECIEPT_SCAN")
    } catch(e) {
      console.error("Error extracting transaction from receipt:", e);
      Alert.alert("Error", "Gagal memproses struk. Silakan coba lagi.")
    } finally {
      setScanning(false);
    }
  }

  const handleVoiceRecorded = async (extracted: ExtractedTransaction) => {
    applyExtraction(extracted);
    setInputMethod("VOICE");
    setVoiceTranscript(extracted.transcript)
  }

  useEffect(() => {
    if(params.action === "scan") {
      setScannerOpen(true)
      router.setParams({action: undefined})
    } else if (params.action === "voice") {
      setVoiceModalOpen(true)
      router.setParams({action: undefined})
    }
  }, [params.action, router])

  useEffect(() => {
    if (accounts.length > 0) {
      resetForm(DEFAULT_VALUES(accounts))
    }
  }, [accounts, resetForm])
  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
      <View className="pb-2 pt-3 px-5">
        <Text className="text-brand-bg text-lg font-bold">Tambah Transaksi</Text>
      </View>
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        {accountsLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#8A8D96" />
          </View>
        ) : accountsError ? (
          <View className="flex-1 items-center justify-center">
            <Feather name="alert-circle" size={24} color="#FF0000" />
            <Text className="text-brand-text-muted text-sm text-center mt-2">Gagal memuat akun. Silakan coba lagi.</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 100,
              paddingHorizontal: 20
            }}
          >
            <View className="flex-row gap-4">
              <AIActionCard
                icon='camera'
                onPress={() => setScannerOpen(true)}
                title='Scan Receipt'
                colors={AI_GRADIENT}
                subtitle='scan struk belanja kamu'
              />
              <AIActionCard
                icon='mic'
                onPress={() => setVoiceModalOpen(true)}
                title='Voice Input'
                colors={AI_GRADIENT_REVERSE}
                subtitle='masukkan transaksi dengan suara'
              />
            </View>

            <View className="flex-row bg-white rounded-xl border border-brand-text-primary p-1 my-4">
              {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => {
                    setValue("type", opt.key);
                    setValue("category",
                      opt.key === "INCOME" ? INCOME_CATEGORIES[0].key : EXPENSE_CATEGORIES[0].key
                    )
                  }}
                  className={`flex-1 items-center justify-center rounded-lg p-2 ${type === opt.key ? "bg-brand-bg" : ""}`}
                >
                  <Text className={`text-sm font-bold ${type === opt.key ? "text-white" : "text-brand-text-muted"}`}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Amount */}
            <View className="mb-4">
              <Text className="text-brand-bg text-lg font-semibold">Amount</Text>
              <Controller
                control={control}
                name="amount"
                render={({ field: { value, onBlur, onChange } }) => (
                  <TextInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(v) => {
                      setError("")
                      onChange(v)
                    }}
                    placeholder="0"
                    placeholderTextColor="#8A8D96"
                    keyboardType='numeric'
                    className="bg-white border border-brand-text-primary rounded-lg p-3 text-brand-bg"
                  />
                )}
              />
              {errors.amount && <Text className="text-brand-coral text-sm">{errors.amount.message}</Text>}
            </View>
            {/* Kategori */}
            <View className="mb-4">
              <Text className="text-brand-bg text-lg font-semibold">Kategori</Text>
              <PillGroup
                options={CATEGORIES.map((c) => ({
                  key: c.key,
                  label: c.label,
                  icon: c.icon
                }))}
                value={category}
                onChange={(key) => setValue("category", key)}
              />
              {errors.category && <Text className="text-brand-coral text-sm">{errors.category.message}</Text>}
            </View>
            {/* Rekening */}
            <View className="mb-4">
              <Text className="text-brand-bg text-lg font-semibold">Rekening</Text>
              <PillGroup
                options={accounts.map((c) => ({
                  key: c.id,
                  label: c.name,
                }))}
                value={accountId}
                onChange={(key) => setValue("accountId", key)}
              />
              {errors.accountId && <Text className="text-brand-coral text-sm">{errors.accountId.message}</Text>}
            </View>
            {/* Date */}
            <View className="mb-4">
              <Text className="text-brand-bg text-lg font-semibold">Rekening</Text>
              <TouchableOpacity
                onPress={() => setDatePickerOpen((v) => !v)}
                className="bg-white border border-brand-text-primary rounded-lg py-2.5 px-3 items-center justify-between flex-row"
              >
                <Text className="text-brand-bg text-lg font-medium">{format(new Date(date), "d MMM yyyy")}</Text>
                <Feather name="calendar" size={16} color="5C5F68" />
              </TouchableOpacity>
            </View>
            {datePickerOpen && (
              <View className="bg-white border border-collapse border-brand-text-primary rounded-lg p-3 mb-4 overflow-hidden">
                <DatePicker
                  value={date}
                  maxDate={new Date()}
                  onChange={(selectedDate) => {
                    setValue("date", selectedDate)
                    setDatePickerOpen(false)
                  }}
                />
              </View>
            )}

            {/* Description */}
            <View className="mb-4">
              <Text className="text-brand-bg text-lg font-semibold">Deskripsi</Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { value, onBlur, onChange } }) => (
                  <TextInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(v) => {
                      setError("")
                      onChange(v)
                    }}
                    placeholder="Contoh: Makan siang di restoran"
                    placeholderTextColor="#8A8D96"
                    autoCapitalize='sentences'
                    className="bg-white border border-brand-text-primary rounded-lg p-3 text-brand-bg"
                  />
                )}
              />
              {errors.description && <Text className="text-brand-coral text-sm">{errors.description.message}</Text>}
            </View>

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={savingTransaction}
              className="bg-brand-bg rounded-xl py-3 items-center"
            >
              <Text className="text-brand-text-primary font-semibold text-base">
                {savingTransaction ? "Menyimpan.." : "Simpan"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
      {scanning && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <View className='bg-white rounded-xl items-center px-6 py-5'>
            <ActivityIndicator size="large" color="#8A8D96" />
            <Text className='text-brand-bg text-base font-medium mt-3'>Memproses struk...</Text>
          </View>
        </View>
      )}

      <ScannerModal 
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCaptured={handleRecieptCaptured}
      />

      <VoiceRecorderModal 
        visible={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onExtracted={handleVoiceRecorded}
      />
    </SafeAreaView>
  )
}