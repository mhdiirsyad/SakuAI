import { useUserStore } from "@/store/userStore"
import { useUser } from "@clerk/expo"
import { useEffect } from "react"
import { useSupabase } from "./useSupabase"

export const useUserSync = () => {
    const { user } = useUser()
    const setCurrency = useUserStore((state) => state.setCurrency)
    const setNeedsOnBoarding = useUserStore((state) => state.setNeedsOnBoarding)
    const currency = useUserStore((state)=> state.currency)
    const needsOnBoarding = useUserStore((state) => state.needsOnBoarding)
    const supabase = useSupabase()

    useEffect(() => {
        if (!user) {
            console.log("useUserSync: user not ready yet")
            return;
        }

        const syncUser = async () => {
            console.log("useUserSync: starting sync for user", user.id)
            try {
                const {
                    data: existingUser,
                    error: fetchError
                } = await supabase.from('users').select('clerk_id, currency').eq('clerk_id', user.id).single()

                if (fetchError && fetchError.code !== "PGRST116") {
                    console.error("Gagal fetch user", fetchError)
                    setNeedsOnBoarding(true)
                    return;
                }

                if (existingUser) {
                    setCurrency(existingUser?.currency ?? "IDR")
                    console.log("useUserSync: user exists, currency=", currency)
                    setNeedsOnBoarding(!existingUser?.currency)
                    console.log("useUserSync: user exists, needsOnboarding=", needsOnBoarding)
                    return;
                }

                const email = user.emailAddresses[0].emailAddress

                const {
                    data: newUser,
                    error: insertError
                } = await supabase.from('users')
                    .upsert({
                        clerk_id: user.id,
                        email: email,
                        name: user.firstName,
                        image_url: user.imageUrl
                    }, { onConflict: "clerk_id", ignoreDuplicates: false })
                    .select('currency')
                    .single()

                if (insertError) {
                    console.error("Gagal insert user", insertError)
                    setNeedsOnBoarding(true)
                    return;
                }

                console.log("useUserSync: new user created, currency=", newUser?.currency)
                setCurrency(newUser?.currency ?? "IDR")
                setNeedsOnBoarding(!newUser?.currency)

                const {
                    error: accountError
                } = await supabase.from('accounts')
                .insert({
                    user_id: user.id,
                    name: "Cash",
                    type: "CASH",
                    balance: 0,
                    is_default: true
                })

                if(accountError) console.error("Gagal Membuat account", accountError)
            } catch (e) {
                console.error("Unexpected error when sync user", e)
                setNeedsOnBoarding(true)
            }
        }
        syncUser()
    }, [user])
}