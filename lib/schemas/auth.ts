import { z } from "zod"

export const signUpSchema = z.object({
    fullName: z.string().trim().min(1, "Nama lengkap harus diisi"),
    email: z.email("Masukkan email yang valid").trim().min(1, "Email harus diisi"),
    password: z.string().min(8, "Password minimal 8 karakter")
})

export type SignUpFormSchema = z.infer<typeof signUpSchema>

export const signInSchema = z.object({
    email: z.email("Masukkan email yang valid").trim().min(1, "Email harus diisi"),
    password: z.string().min(8, "Password minimal 8 karakter")
})

export type SignInFormSchema = z.infer<typeof signInSchema>

export const codeSchema = z.object({
    code: z.string().min(1, "Masukkan kode verifikasi")
})

export type CodeFormSchema = z.infer<typeof codeSchema>