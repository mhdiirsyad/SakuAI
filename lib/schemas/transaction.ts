import { CategoryKey } from "@/constants/category"
import { z } from "zod"

export const transactionSchema = z.object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z.string().min(1, "Masukkan jumlah")
    .refine((v) => {
        const parsed = parseFloat(v.replace(/,/g, ""))
        return !Number.isNaN(parsed) && parsed > 0
    }, "Masukkan jumlah yang valid"),
    category: z.custom<CategoryKey>((v) => typeof v === "string"),
    accountId: z.string().min(1, "Pilih rekening"),
    description: z.string().optional(),
    date: z.date()
})

export type TransactionFormSchema = z.infer<typeof transactionSchema>