import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!

if(!supabaseUrl || !supabaseKey) {
    throw new Error("Missing environment supabase variable")
}

export function createClerkSupabaseClient(
    getToken: () => Promise<string | null>
) {
    return createClient(supabaseUrl, supabaseKey, {
        async accessToken() {
            return getToken()
        }
    })
}