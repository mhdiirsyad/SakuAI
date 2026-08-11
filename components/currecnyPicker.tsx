import { Feather } from '@expo/vector-icons'
import cc from 'currency-codes'
import getSymbol from 'currency-symbol-map'
import { useMemo, useState } from 'react'
import { FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export type CurrencyEntry = {
    code: string
    name: string
    symbol: string
}
export const ALL_CURRENCIES: CurrencyEntry[] = cc.codes().map((code) => ({
    code,
    name: cc.code(code)?.currency ?? code, 
    symbol: getSymbol(code) ?? code
})).filter((c) => c.symbol !== c.code)

interface CurrencyPickerProps {
    visible: boolean
    onClose: () => void
    onSelect: (currency: CurrencyEntry) => void
    selectedCode: string
}
export default function CurrencyPicker({
    visible,
    onClose,
    onSelect,
    selectedCode
}: CurrencyPickerProps) {
    const [search, setSearch] = useState("")
    const filteredCurrencies = useMemo(() => {
        const q = search.toLowerCase()
        if (!q) return ALL_CURRENCIES
        return ALL_CURRENCIES.filter((c) =>
            c.code.toLowerCase().includes(q) 
            || c.name.toLowerCase().includes(q)
        )
    }, [search])
    return (
        <Modal 
            visible={visible}
            animationType='slide'
            presentationStyle='pageSheet'
        >
            <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
                <View className="flex-row gap-3 items-center px-3 py-6">
                    <TextInput 
                        value={search}
                        onChangeText={setSearch}
                        className="flex-1 border-gray-200 rounded-xl border text-brand-bg"
                        placeholder='Cari mata uang'
                        placeholderTextColor="#8A8D96"
                        autoFocus
                    />
                    <TouchableOpacity
                        onPress={() => {
                            setSearch("")
                            onClose()
                        }}
                    >
                        <Text className="text-brand-text-secondary text-sm">Batal</Text>
                    </TouchableOpacity>
                </View>

                <FlatList 
                    data={filteredCurrencies}
                    keyExtractor={(item) => item.code}
                    keyboardShouldPersistTaps='handled'
                    renderItem={({item}) => (
                        <TouchableOpacity
                            onPress={() => {
                                onSelect(item)
                                setSearch("")
                            }}
                            className={`px-3 py-4 border-b border-gray-200 flex-row items-center gap-3 justify-between ${item.code === selectedCode ? "bg-brand-blue/10" : ""}`}
                        >
                            <Text className="text-sm w-8 text-brand-text-secondary text-center">{item.symbol}</Text>
                            <Text className="text-sm font-medium text-brand-bg">{item.name}</Text>
                            <Text className="text-sm w-8 text-brand-text-secondary flex-1">{item.code}</Text>
                            {item.code === selectedCode && (
                                <Feather name="check" size={20} color="#1A1D26" />
                            )}
                        </TouchableOpacity>
                    )}
                />
            </SafeAreaView>
        </Modal>
    )
}