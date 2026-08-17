import { AccountType, createAccount, deleteAccount, setDefaultAccount, updateAccount } from "@/lib/services/account";
import { useUser } from "@clerk/expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "../useSupabase";

export function useCreateAccount() {
    const { user } = useUser()
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: { name: string, type: AccountType }) => createAccount(supabase, user!.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['accounts']
            })
        }
    })
}

export function useUpdateAccount() {
    const { user } = useUser()
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            accountId,
            payload
        }: {
            payload: { name: string, type: AccountType },
            accountId: string
        }) => updateAccount(supabase, user!.id, accountId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['accounts']
            })
        }
    })
}

export function useDeleteAccount() {
    const { user } = useUser()
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            accountId,
            force = false
        }: {
            force?: boolean,
            accountId: string
        }) => deleteAccount(supabase, user!.id, accountId, { force }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
        }
    })
}

export function useSetDefaultAccount() {
    const { user } = useUser()
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (accountId: string) => setDefaultAccount(supabase, user!.id, accountId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
        }
    })
}