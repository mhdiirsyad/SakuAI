import { COLORS } from '@/constants/theme';
import { useBudgetUpsert } from '@/hooks/mutations/useBudgetMutation';
import { Budget } from '@/lib/services/budget';
import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import FormSheetModal from './formSheetModal';

export default function BudgetModal({
    visible,
    budget,
    onClose,
    onSaved
}: {
    visible: boolean;
    budget: Budget | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [amount, setAmount] = useState("")
    const [error, setError] = useState("")

    const {
        mutateAsync: upsertBudget,
        isPending: saving
    } = useBudgetUpsert()

    useEffect(() => {
        if (visible) {
            setAmount(budget?.amount.toString() || "")
            setError("")
        }
    }, [visible, budget])

    const handleSave = async () => {
        const parsedAmount = parseFloat(amount.replace(/,/g, ''))

        if(!parsedAmount || parsedAmount <=0 ){
            setError("Masukkan jumlah yang valid")
            return;
        }

        setError("")
        try {
            await upsertBudget(parsedAmount)
            onSaved()
        } catch (e) {
            console.log("Error save budget", e)
            setError("Terjadi kesalahan saat menyimpan anggaran")
        }
    }
    return (
        <FormSheetModal
            visible={visible}
            title={budget ? "Ubah Angaran" : "Atur Anggaran"}
            onClose={onClose}
        >
            <Text className="text-lg font-bold text-brand-bg mb-1.5">Budget Bulanan</Text>
            <TextInput
                value={amount}
                onChangeText={(v) => {
                    setError("")
                    setAmount(v)
                }}
                placeholder="cth:50000"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="numeric"
                autoFocus
                className="bg-white border border-brand-text-primary text-brand-bg rounded-lg px-4 py-3 mb-1.5"
            />
            {error ? <Text className="text-brand-coral mb-0.5">{error}</Text> : null}
            <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="bg-brand-blue py-3 rounded-xl items-center mt-1"
            >
                <Text className="text-white font-semibold">Simpan</Text>
            </TouchableOpacity>
        </FormSheetModal>
    )
}