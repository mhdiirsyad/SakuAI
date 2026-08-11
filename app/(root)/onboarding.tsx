import CurrencyPicker, { ALL_CURRENCIES } from '@/components/currecnyPicker'
import { useSupabase } from '@/hooks/useSupabase'
import { OnBoardingFormSchema, onboardingSchema } from '@/lib/schemas/oboarding'
import { useUserStore } from '@/store/userStore'
import { useUser } from '@clerk/expo'
import { Feather } from '@expo/vector-icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ActivityIndicator, KeyboardAvoidingView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function OnBoardingScreen() {
    const supabase = useSupabase()
    const { user } = useUser()
    const setCurrency = useUserStore((state) => state.setCurrency)
    const setNeedsOnBoarding = useUserStore((state) => state.setNeedsOnBoarding)
    const router = useRouter()

    const {
        control: onboardingControl,
        formState: { errors: onboardingErrors },
        handleSubmit: handleOnboardingSubmit,
    } = useForm<OnBoardingFormSchema>({
        resolver: zodResolver(onboardingSchema),
        mode: "onBlur",
        defaultValues: {
            startingBalance: ""
        }
    })

    const [selectedCurrency, setSelectedCurrency] = useState(
        ALL_CURRENCIES.find((c) => c.code === "IDR") ?? ALL_CURRENCIES[0]
    )
    const [pickerOpen, setPickerOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const handleSave = async (values: OnBoardingFormSchema) => {
        const parsed = parseFloat(values.startingBalance.replace(/,/g, ""))
        setSaving(true)
        setError("")

        const { error: currencyError} = await supabase.from('users')
        .update({
            currency: selectedCurrency.code
        }).eq('clerk_id', user!.id)

        if (currencyError) {
            setSaving(false)
            setError("Gagal menyimpan mata uang")
            return;
        }

        const { data: defaultAccount, error: accountError} = await supabase.from('accounts')
        .select('id, balance')
        .eq('user_id', user!.id)
        .eq('is_default', true)
        .single()

        if (accountError || !defaultAccount) {
            setSaving(false)
            setError("Gagal mengambil data akun")
            return;
        }

        const { error: txError } = await supabase.from('transactions')
        .insert({
            user_id: user!.id,
            account_id: defaultAccount.id,
            type: "INCOME",
            amount: parsed,
            category: "other_income",
            description: 'Saldo Awal',
            date: new Date().toDateString(),
            input_method: "MANUAL",
        })

        if(txError) {
            setSaving(false)
            setError("Gagal menyimpan saldo awal")
            return;
        }

        const { error: balanceError } = await supabase.from('accounts')
        .update({ balance: defaultAccount.balance + parsed })
        .eq('id', defaultAccount.id)

        if(balanceError) {
            setSaving(false)
            setError("Gagal memperbarui saldo akun")
            return;
        }

        setSaving(false)
        setCurrency(selectedCurrency.code)
        setNeedsOnBoarding(false)
        router.replace('/(root)/(tabs)')
    }
    return (
        <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
            <KeyboardAvoidingView className="flex-1" behavior='padding'>
                <View className="flex-1 px-6 justify-center">
                    <Text className="text-3xl text-gray-900 font-bold mb-2 leading-tight">
                        Selamat Datang di SakuAI
                    </Text>
                    <Text className="text-muted text-sm mb-2">
                        Masukkan saldo awal dan pilih mata uang yang ingin digunakan
                    </Text>
                    <Text className="text-sm font-semibold text-brand-bg">Saldo Awal</Text>
                    <View className="mb-2 flex-row items-center space-x-2 bg-white border-gray-200 border rounded-xl px-4 py-1">
                        <Text className="text-muted text-sm ">
                            {selectedCurrency.symbol}
                        </Text>
                        <Controller
                            name='startingBalance'
                            control={onboardingControl}
                            render={({ field: { onChange, value } }) => {
                                return (
                                    <TextInput
                                        className="text-gray-900 flex-1"
                                        placeholder='cth: 50000'
                                        placeholderTextColor="#8A8D96"
                                        returnKeyType='done'
                                        keyboardType='numeric'
                                        value={value}
                                        onChangeText={(v) => {
                                            setError("")
                                            onChange(v)
                                        }}
                                    />
                                )
                            }}
                        />
                        {onboardingErrors.startingBalance && (
                            <Text className="text-brand-coral text-sm mb-1">{onboardingErrors.startingBalance.message}</Text>
                        )}
                    </View>
                    <View className="mb-2">
                        <Text className="text-sm font-semibold text-brand-bg">Mata Uang</Text>
                        <TouchableOpacity
                            onPress={() => setPickerOpen(true)}
                            className='bg-white flex-row border border-gray-200 rounded-xl px-4 py-3 items-center justify-between'
                        >
                            <Text className='text-brand-bg text-sm'>
                                {selectedCurrency.symbol} {selectedCurrency.code} - {selectedCurrency.name}
                            </Text>
                            <Feather name="chevron-down" size={20} color="#8A8D96" />
                        </TouchableOpacity>
                    </View>
                    {error ? (
                        <Text className="text-brand-coral text-sm mb-4">{error}</Text>
                    ) : null}

                    <TouchableOpacity
                        className="bg-brand-blue w-full rounded-xl py-3 mt-4 items-center"
                        onPress={handleOnboardingSubmit(handleSave)}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#0000ff" />
                        ) : (
                            <Text className="text-white font-semibold text-base">Simpan</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <CurrencyPicker 
                visible={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={(currency) => {
                    setSelectedCurrency(currency)
                    setPickerOpen(false)
                }}
                selectedCode={selectedCurrency.code}
            />
        </SafeAreaView>
    )
}