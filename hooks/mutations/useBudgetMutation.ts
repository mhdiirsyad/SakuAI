import { upsertBudget } from "@/lib/services/budget";
import { useUser } from "@clerk/expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "../useSupabase";

export function useBudgetUpsert() {
    const {user} = useUser()
    const supabase = useSupabase()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (amount: number) => upsertBudget(supabase, user!.id, amount),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['budgets']
            })
        }
    })
}