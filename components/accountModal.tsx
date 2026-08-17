import { useCreateAccount, useDeleteAccount, useUpdateAccount } from '@/hooks/mutations/useAccountMutation'
import { AccountFormSchema, AccountSchema } from '@/lib/schemas/account'
import { Account, AccountType } from '@/lib/services/account'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import FormSheetModal from './formSheetModal'
import PillGroup from './pillGroup'

const ACCOUNT_TYPES: AccountType[] = ["BANK", "CASH", "CREDIT_CARD", "SAVINGS"]
const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    BANK: "Bank",
    CASH: "Tunai",
    CREDIT_CARD: "Kartu Kredit",
    SAVINGS: "Tabungan",
}

export default function AccountModal({
    visible,
    account,
    onClose,
    onSaved,
    onDeleted,
    onSetDefault,
}: {
    visible: boolean,
    account: Account | null,
    onClose: () => void,
    onSaved: () => void,
    onDeleted: () => void,
    onSetDefault: () => void,
}) {
    const isEditing = !!account

    const { mutateAsync: createAccount, isPending: creating } = useCreateAccount()
    const { mutateAsync: updateAccount, isPending: updating } = useUpdateAccount()
    const { mutateAsync: deleteAccount } = useDeleteAccount()

    const loading = creating || updating

    const {
        handleSubmit,
        control,
        formState: { errors },
        reset,
        setError
    } = useForm<AccountFormSchema>({
        mode: "onBlur",
        resolver: zodResolver(AccountSchema),
        defaultValues: {
            name: account?.name ?? "",
            type: account?.type ?? "BANK"
        }
    })

    useEffect(() => {
        if (visible) {
            reset({
                name: account?.name ?? "",
                type: account?.type ?? "BANK"
            })
        }
    }, [visible, account, reset])


    const handleSave = async (values: AccountFormSchema) => {
        try {
            if (isEditing) {
                await updateAccount({
                    accountId: account!.id,
                    payload: {
                        name: values.name,
                        type: values.type,
                    }
                })
            } else {
                await createAccount({
                    name: values.name,
                    type: values.type
                })
            }
            onSaved()
        } catch {
            setError(
                'root',
                { message: "Gagal menyimpan akun. Silahkan coba lagi." }
            )
        }
    }

    const handleDelete = async () => {
        if (!account) return;
        try {
            const result = await deleteAccount({
                accountId: account.id,
            })
            if (result.deleted) {
                onDeleted()
                return;
            }

            Alert.alert(
                "Hapus Akun",
                `Tindakan ini juga akan menghapus ${result.transactionsCount} transaksi dan Tidak bisa DIBATALKAN.`,
                [
                    { text: "Batal", style: "cancel" },
                    {
                        text: "Hapus",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                await deleteAccount({
                                    accountId: account.id,
                                    force: true
                                })
                                onDeleted()
                            } catch {
                                Alert.alert("Error", "Gagal menghapus akun. Silakan coba lagi.")
                            }
                        }
                    }
                ]
            )
        } catch {
            Alert.alert("Error", "Tidak dapat cek transaksi. Silakan coba lagi.")
        }
    }

    return (
        <FormSheetModal
            visible={visible}
            title={isEditing ? "Edit Account" : "Add Account"}
            onClose={onClose}
        >
            <View className="mb-4">
                <Text className="text-brand-bg text-lg font-semibold">Nama</Text>
                <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            value={value}
                            onBlur={onBlur}
                            onChangeText={(v) => {
                                onChange(v)
                            }}
                            placeholder="BCA"
                            placeholderTextColor="#8A8D96"
                            className="bg-white border border-brand-text-primary rounded-lg p-3 text-brand-bg"
                        />
                    )}
                />
                {errors.name && (
                    <Text className="text-brand-coral text-sm">{errors.name.message}</Text>
                )}
            </View>
            <View className="mb-4">
                <Text className="text-brand-bg text-lg font-semibold">Tipe</Text>
                <Controller
                    control={control}
                    name='type'
                    render={({ field: { value, onChange } }) => (
                        <PillGroup
                            options={ACCOUNT_TYPES.map((t) => ({
                                key: t,
                                label: ACCOUNT_TYPE_LABELS[t],
                            }))}
                            value={value}
                            onChange={onChange}
                        />
                    )}
                />
                {errors.type && (
                    <Text className="text-brand-coral text-sm">{errors.type.message}</Text>
                )}
            </View>

            {errors.root && (
                <Text className="text-brand-coral text-sm mb-2">{errors.root.message}</Text>
            )}
            <TouchableOpacity
                onPress={handleSubmit(handleSave)}
                disabled={loading}
                className="bg-brand-surface py-3 rounded-xl items-center mt-1"
            >
                <Text className="text-white font-semibold">
                    {loading ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Tambah Akun"}
                </Text>
            </TouchableOpacity>

            {isEditing && !account.is_default && (
                <TouchableOpacity
                    onPress={onSetDefault}
                    disabled={loading}
                    className="py-3 rounded-xl items-center mt-1"
                >
                    <Text className="text-brand-blue font-semibold">
                        Jadikan Default
                    </Text>
                </TouchableOpacity>
            )}

            {isEditing && (
                <TouchableOpacity
                    onPress={handleDelete}
                    disabled={loading}
                    className="py-3 rounded-xl items-center mt-1"
                >
                    <Text className="text-brand-coral font-semibold">
                        Hapus Akun
                    </Text>
                </TouchableOpacity>
            )}


        </FormSheetModal>
    )
}