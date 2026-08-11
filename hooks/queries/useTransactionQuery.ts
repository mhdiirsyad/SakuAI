import { queryKeys } from "@/lib/query/keys";
import { getTransactions, TransactionFilter } from "@/lib/services/transaction";
import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "../useSupabase";

export function useTransactionQuery(filters?: TransactionFilter) {
    const { user } = useUser()
    const supabase = useSupabase()

    return useQuery({
        queryKey: queryKeys.transactions(user?.id, filters),
        queryFn: () => getTransactions(supabase, user!.id, filters),
        enabled: !!user
    })
}