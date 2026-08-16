import React from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

export type PillOPtions<T extends string> = {
    key: T
    label: string
    icon?: string
}

export default function PillGroup<T extends string>({
    options,
    value,
    onChange,
    scrollable = true
}: {
    options: PillOPtions<T>[]
    value: T;
    onChange: (key: T) => void;
    scrollable?: boolean
}) {
    const row = (
        <View className="flex-row gap-2">
            {options.map((opt) => (
                <TouchableOpacity
                    key={opt.key}
                    onPress={() => onChange(opt.key)}
                    className={`flex-row items-center gap-2 rounded-full px-3 py-2 border 
                    ${value === opt.key ? "bg-brand-bg border-brand-surface" : "bg-white border-brand-text-primary"}`}
                >
                    {opt.icon && (
                        <Text className={`text-sm font-medium ${value === opt.key ? "text-white" : "text-brand-text-muted"}`}>
                            {opt.icon}
                        </Text>
                    )}
                    <Text className={`text-sm font-medium ${value === opt.key ? "text-white" : "text-brand-text-muted"}`}
                    >
                        {opt.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    )

    if (!scrollable) return row
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {row}
        </ScrollView>
    )
}