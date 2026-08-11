import { queryKeys } from "@/lib/query/keys";
import { getAccounts } from "@/lib/services/account";
import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "../useSupabase";

export function useAccountQuery() {
    const { user } = useUser()
    const supabase = useSupabase()

    return useQuery({
        queryKey: queryKeys.accounts(user?.id),
        queryFn: () => getAccounts(supabase, user!.id),
        enabled: !!user
    })
}