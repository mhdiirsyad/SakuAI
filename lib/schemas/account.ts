import z from "zod";
import { AccountType } from "../services/account";

export const AccountSchema = z.object({
    name: z.string().min(1, "Masukkan nama akun"),
    type: z.custom<AccountType>((v) => typeof v === "string"),
})

export type AccountFormSchema = z.infer<typeof AccountSchema>