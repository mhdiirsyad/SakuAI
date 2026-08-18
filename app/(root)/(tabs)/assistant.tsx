import { useBudgetQuery } from '@/hooks/queries/useBudgetQuery';
import { useTransactionQuery } from '@/hooks/queries/useTransactionQuery';
import { askAssistant } from '@/lib/services/assistant';
import { useUserStore } from '@/store/userStore';
import { useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Berapa total pengeluaran saya bulan ini?",
  "Berapa total pemasukan saya bulan ini?",
  "Berapa sisa budget saya bulan ini?",
]

const InitialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "Hi! tanya saja tentang keuanganmu dalam 30 hari terakhir"
  }
]

function MessageBuble({message} : {message: ChatMessage}) {
  const isUser = message.role === "user"
  return (
    <View className={`mb-3 max-w-[85%] ${isUser ? "self-end" : "self-start"}`}>
      <View className={`rounded-2xl px-3 pb-3 ${isUser ? "bg-brand-surface py-2" : "bg-white border border-brand-text-primary"}`}>
        {isUser ? (
          <Text className={`text-sm ${isUser ? "text-brand-text-primary" : "text-brand-bg"}`}>{message.content}</Text>
        ) : (
          <Markdown style={{
            body: {
              color: "#1A1D26",
              fontSize: 14,
              lineHeight: 20,
            }
          }}>
            {message.content}
          </Markdown>
        )}
      </View>
    </View>
  )
}

export default function AssistantScreen() {
  const { user } = useUser()
  const currency = useUserStore((state) => state.currency)
  const { refetch: refetchTransactions } = useTransactionQuery()
  const { refetch: refetchBudget } = useBudgetQuery()

  const [messages, setMessages] = useState<ChatMessage[]>(InitialMessages)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)

  const sendMessage = async (message: string) => {
    if(!message.trim() || sending || !user) return;

    const chatMsg: ChatMessage ={
      id: Date.now().toString(),
      role: "user",
      content: message
    }

    setMessages((prev) => [...prev, chatMsg])
    setInput("")
    setSending(true)

    try {
      const [{data: transactions = []}, {data: budget = null}] = await Promise.all([refetchTransactions(), refetchBudget()])
      const reply = await askAssistant(message, transactions, budget, currency)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: reply
        }
      ])
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Maaf, terjadi kesalahan saat memproses pertanyaanmu. Silakan coba lagi."
        }
      ])
    } finally {
      setSending(false)
    }
  }
  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={['top']}>
      <View className="pb-2 pt-3 px-5">
        <Text className="text-brand-bg text-lg font-bold">Assistant</Text>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1"
      >
        <FlatList 
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({item}) => {
            return <MessageBuble message={item} />
          }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 20,
            paddingTop: 10,
          }}

          ListFooterComponent={
            sending ? (
              <View className='self-start mb-3 bg-white border border-brand-text-primary rounded-2xl px-3 py-2'>
                <ActivityIndicator size="small" color="#4A9EFF" />
              </View>
            ) : null
          }
        />

        {messages.length <= 1 && (
          <View className="px-3 pb-2 gap-0.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <TouchableOpacity
                key={q}
                onPress={() => sendMessage(q)}
                className="bg-white border border-brand-text-primary rounded-xl px-3.5 py-2.5 self-start"
              >
                <Text className="text-brand-text-secondary text-sm">{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className='flex-row items-center justify-between px-5 pt-2 mb-3 gap-2'>
          <TextInput 
            value={input}
            onChangeText={setInput}
            placeholder='Tanya tentang keuanganmu...'
            placeholderTextColor="#8A8D96"
            editable={!sending}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            className="flex-1 bg-white border border-brand-text-primary rounded-full px-3.5 py-2.5 text-brand-bg text-sm"
          />
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={sending || input.trim() === ""}
            className="bg-brand-surface rounded-full w-11 h-11 items-center justify-center"
          >
            <Feather name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}