import { z } from "zod";

export const onboardingSchema = z.object({
    startingBalance: z.string()
    .min(1, "Masukkan Saldo Awal")
    .refine((v) => {
        const parsed = parseFloat(v.replace(/,/g, ""))
        return !Number.isNaN(parsed) && parsed > 0
    }, "Masukkan saldo awal yang valid")
})

export type OnBoardingFormSchema = z.infer<typeof onboardingSchema>