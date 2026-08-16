import { CategoryKey } from "@/constants/category";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TransactionType = 'INCOME' | 'EXPENSE'
export type InputMethod = 'MANUAL' | 'RECIEPT_SCAN' | 'VOICE'

export type Transaction = {
    id: string;
    user_id: string;
    account_id: string;
    type: TransactionType;
    amount: number;
    category: CategoryKey;
    description: string | null;
    status: string;
    date: string;
    input_method: InputMethod;
    voice_transcript: string | null;
    is_flagged: boolean;
    flag_reason: string | null;
    created_at: string;
    updated_at: string;
}

export type TransactionFilter = {
    type?: TransactionType | null;
    accountId?: string | null;
}

export async function getTransactions(
    supabase: SupabaseClient,
    userId: string,
    filters: TransactionFilter = {},
) {
    let query = supabase.from('transactions').select('*').eq('user_id', userId)

    if (filters.type) query = query.eq('type', filters.type)
    if (filters.accountId) query = query.eq('account_id', filters.accountId)

    const { error, data } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data as Transaction[]
}

export async function deleteTransaction(
    supabase: SupabaseClient,
    transactionId: string,
    accountId: string,
    amount: number,
    type: TransactionType,
) {
    const { error: deleteError } = await supabase.from('transactions')
        .delete()
        .eq('id', transactionId)

    if (deleteError) return { error: deleteError }

    const { data: accountBalance, error: balanceError } = await supabase.from('accounts')
        .select('balance')
        .eq('id', accountId)
        .single()

    if (balanceError) return { error: balanceError }

    const delta = type === 'INCOME' ? -amount : amount

    const { error: updateError } = await supabase.from('accounts')
        .update({ balance: accountBalance.balance + delta })
        .eq('id', accountId)

    if (updateError) return { error: updateError }

    return { error: null }
}

export type NewTransaction = {
    user_id: string;
    account_id: string;
    type: TransactionType;
    amount: number;
    category: CategoryKey;
    description: string | null;
    date: string;
    input_method: InputMethod;
    voice_transcript: string | null;
}

export async function createTransaction(
    supabase: SupabaseClient,
    payload: NewTransaction
) {
    const {data: insertData, error: insertError} = await supabase.from("transactions")
    .insert(payload)
    .select()
    .single()

    if(insertError) return {transaction: null, error: insertError}

    const { data: accountBalance, error: balanceError } = await supabase.from('accounts')
        .select('balance')
        .eq('id', payload.account_id)
        .single()

    if (balanceError) return { error: balanceError }

    const delta = payload.type === 'INCOME' ? payload.amount : -payload.amount

    const { error: updateError } = await supabase.from('accounts')
        .update({ balance: accountBalance.balance + delta })
        .eq('id', payload.account_id)

    if (updateError) return { error: updateError }

    return {transaction: insertData as Transaction, error: null}
}