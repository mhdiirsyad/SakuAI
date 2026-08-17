import AccountModal from '@/components/accountModal'
import CurrencyPicker from '@/components/currencyPicker'
import { useSetDefaultAccount } from '@/hooks/mutations/useAccountMutation'
import { useAccountQuery } from '@/hooks/queries/useAccountQuery'
import { useSupabase } from '@/hooks/useSupabase'
import { Account, AccountType } from '@/lib/services/account'
import { formatPrice } from '@/lib/utils'
import { useUserStore } from '@/store/userStore'
import { useAuth, useUser } from '@clerk/expo'
import { Feather } from '@expo/vector-icons'
import { Image } from "expo-image"
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const ACCOUNT_ICON: Record<AccountType, keyof typeof Feather.glyphMap> = {
  BANK: "home",
  CASH: "dollar-sign",
  CREDIT_CARD: "credit-card",
  SAVINGS: "shield",
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-brand-text-muted uppercase text-sm tracking-wider mb-2 mt-5 mx-4">
      {children}
    </Text>
  )
}

function Row({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  danger = false
}: {
  icon: keyof typeof Feather.glyphMap,
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className='flex-row items-center bg-white px-4 py-3 border-b border-brand-text-primary last:border-b-0'
    >
      <View className="w-8 h-8 rounded-full bg-brand-text-primary items-center justify-center mr-3">
        <Feather name={icon} size={16} color={danger ? "#FF4D4F" : "#5C5F68"} />
      </View>

      <Text className={`flex-1 text-sm ${danger ? "text-brand-coral" : "text-brand-bg"}`}>
        {label}
      </Text>

      {value && (
        <Text className="text-sm text-brand-text-secondary mr-2">
          {value}
        </Text>
      )}

      {showChevron && onPress && (
        <Feather name="chevron-right" size={16} color="#BDC3C7" />
      )}
    </TouchableOpacity>
  )
}

export default function ProfileScreen() {
  const { user } = useUser()
  const { signOut } = useAuth()
  const router = useRouter()

  const supabase = useSupabase()
  const currency = useUserStore((state) => state.currency)
  const setCurrency = useUserStore((state) => state.setCurrency)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    isError: accountsError,
    refetch: refetchAccounts
  } = useAccountQuery()

  const { mutateAsync: setDefaultAccountMutation } = useSetDefaultAccount()

  const handleSetDefaultAccount = async () => {
    if(!editingAccount) return;

    try {
      await setDefaultAccountMutation(editingAccount.id)
      closeModal()
    } catch {
      Alert.alert("Error", "Gagal mengatur akun default. Silakan coba lagi.")
    }
  }

  const handlePickAvatar = async () => {
    if (!user) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert("Permission Denied", "Permission untuk mengakses galeri ditolak.")
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true
    })

    if (result.canceled) return;

    setUploadingAvatar(true)
    try {
      const asset = result.assets[0]
      const filename = asset.uri.split("/").pop() || "avatar.jpg"
      const match = /\.(\w+)$/.exec(filename)
      const mimeType = match ? `image/${match[1]}` : `image`
      const dataUrl = `data:${mimeType};base64,${asset.base64}`

      await user.setProfileImage({ file: dataUrl })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      Alert.alert("Error", "Gagal mengunggah avatar. Silakan coba lagi.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCurrencySelect = async (selected: {code: string}) => {
    setCurrencyPickerOpen(false)
    if(!user) return;
    
    try {
      const { error } = await supabase.from("users")
      .update({currency: selected.code})
      .eq("clerk_id", user.id)

      if(error) throw error;
      setCurrency(selected.code)
    } catch {
      Alert.alert("Error", "Gagal mengubah mata uang. Silakan coba lagi.")
    }
  }

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          await signOut()
          router.replace("/sign-in")
        }
      }
    ])
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingAccount(null)
  }
  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-4 py-2.5">
          <Text className='text-brand-bg text-xl font-bold'>Profile</Text>
        </View>

        <View className="px-4 py-5 mx-5 bg-brand-bg rounded-2xl items-center">
          <TouchableOpacity
            onPress={handlePickAvatar}
            disabled={uploadingAvatar}
            activeOpacity={0.8}
            className='w-20 h-20 rounded-full bg-brand-surface items-center justify-center border-2 border-brand-surface-border overflow-hidden'
          >
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#8A8D96" />
            ) : user?.imageUrl && user.hasImage ? (
              <Image
                source={{ uri: user.imageUrl }}
                className='w-[80px] h-[80px] rounded-full'
                contentFit='cover'
              // style={{width: 80, height: 80}}
              />
            ) : (
              <Feather name="user" size={32} color="#8A8D96" />
            )}
            <View className="absolute inset-x-0 bottom-0 bg-black/20 items-center justify-center h-6">
              <Feather name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text className="text-brand-text-primary text-lg font-bold mt-3">
            {user?.firstName}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-1">
            <Feather name="mail" size={14} color="#8A8D96" />
            <Text className="text-brand-text-secondary text-sm">
              {user?.emailAddresses?.[0]?.emailAddress}
            </Text>
          </View>
        </View>

        {/* Account */}
        <SectionLabel>Account</SectionLabel>
        <View className="mx-4 rounded-2xl overflow-hidden border border-brand-text-primary">
          {accountsLoading ? (
            <View className="bg-white px-4 py-5 items-center">
              <ActivityIndicator color="#5C5F68" />
            </View>
          ) : accountsError ? (
            <View className="bg-white px-4 py-5 items-center">
              <Text className="text-brand-coral text-sm">
                Error loading accounts
              </Text>
            </View>
          ) : (
            accounts.map((account) => (
              <Row
                key={account.id}
                icon={ACCOUNT_ICON[account.type]}
                label={account.name + (account.is_default ? " (Default)" : "")}
                value={formatPrice(account.balance, currency)}
                onPress={() => {
                  setEditingAccount(account)
                  setModalOpen(true)
                }}
              />
            ))
          )}
          <Row
            icon='plus'
            label="Tambah Akun Baru"
            onPress={() => {
              setEditingAccount(null)
              setModalOpen(true)
            }}
          />
        </View>

        {/* Preferences */}
        <SectionLabel>Preferences</SectionLabel>
        <View className="mx-4 rounded-2xl overflow-hidden border border-brand-text-primary">
          <Row 
            icon="dollar-sign"
            label="Currency"
            value={currency}
            onPress={() => setCurrencyPickerOpen(true)}
          />
        </View>

        {/* User Actions */}
        <SectionLabel>User Actions</SectionLabel>

        <View className="mx-4 rounded-2xl overflow-hidden border border-brand-text-primary">
          <Row
            icon='log-out'
            label='Sign Out'
            onPress={handleSignOut}
            showChevron={false}
            danger
          />
        </View>
      </ScrollView>

      {user && (
        <AccountModal 
          visible={modalOpen}
          account={editingAccount}
          onClose={closeModal}
          onSaved={closeModal}
          onDeleted={closeModal}
          onSetDefault={handleSetDefaultAccount}
        />
      )}

      <CurrencyPicker 
        visible={currencyPickerOpen}
        onClose={() => setCurrencyPickerOpen(false)}
        onSelect={handleCurrencySelect}
        selectedCode={currency}
      />
    </SafeAreaView>
  )
}