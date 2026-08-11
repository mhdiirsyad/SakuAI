import { getCategoryConfig } from '@/constants/category';
import { Transaction } from '@/lib/services/transaction';
import { formatPrice } from '@/lib/utils';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

const INPUT_METHOD: Record<Transaction['input_method'], keyof typeof Feather.glyphMap> = {
  'MANUAL': 'edit-3',
  'RECIEPT_SCAN': 'camera',
  'VOICE': 'mic',
}
export default function TransactionRow({ tx, onDelete }: { tx: Transaction; onDelete?: () => void }) {
  const config = getCategoryConfig(tx.category);
  const isIncome = tx.type === 'INCOME';

  const row = (
    <View
      className="flex-row items-center p-4 bg-white rounded-xl border border-brand-text-primary"
      style={{ borderLeftWidth: 3, borderLeftColor: config.color }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${config.color}22` }}
      >
        <Text className="text-lg">{config.icon}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-sm text-brand-bg font-semibold" numberOfLines={1}>
          {tx.description || config.label}
        </Text>
        <View className="flex-row items-center gap-2">
          <Feather name={INPUT_METHOD[tx.input_method]} size={12} color='#1A85FF' />
          <View className="rounded-full px-1.5 py-0.5" style={{ backgroundColor: `${config.color}1A` }}>
            <Text className="text-xs font-semibold" style={{ color: config.color }}>
              {config.label}
            </Text>
          </View>

          {tx.is_flagged && (
            <View className="flex-row items-center gap-1 ml-1">
              <Feather name="alert-triangle" size={12} color='#FF0000' />
              <Text className="text-brand-coral text-sm">Flagged</Text>
            </View>
          )}
        </View>
      </View>
      <Text
        className={`text-lg font-semibold ${isIncome ? 'text-brand-success' : 'text-brand-coral'}`}
      >
        {isIncome ? '+' : '-'}
        {formatPrice(tx.amount)}
      </Text>
    </View>
  )

  if (!onDelete) return (
    <View className="mb-2">
      {row}
    </View>
  )
  return (
    <View className="mb-2">
      <Swipeable
        overshootRight={false}
        renderRightActions={() => (
          <TouchableOpacity
          onPress={onDelete}
          className="bg-brand-coral justify-center items-center rounded-xl ml-2 w-16 px-4"
          >
            <Feather name="trash-2" size={24} color="white" />
          </TouchableOpacity>
        )}
      >
      {row}
      </Swipeable>
    </View>
  )
}