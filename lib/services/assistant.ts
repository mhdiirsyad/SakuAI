import { getCategoryConfig } from "@/constants/category";
import { format, isSameMonth, subDays } from "date-fns";
import { formatPrice } from "../utils";
import { Budget } from "./budget";
import { Transaction } from "./transaction";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent"

function buildContext(
    transactions: Transaction[],
    budget: Budget | null,
    currency: string
) {
    const now = new Date()
    const cutoff = subDays(now, 30)
    const recent = transactions.filter((tx) => new Date(tx.date) >= cutoff)

    const thisMonthExpense = transactions.filter(
        (tx) => isSameMonth(new Date(tx.date), now) && tx.type === "EXPENSE"
    ).reduce((sum, tx) => sum + tx.amount, 0)

    const spentByCategory: Record<string, number> = {}
    let income = 0
    let expense = 0

    recent.forEach((tx) => {
        if (tx.type === "EXPENSE") {
            expense += tx.amount
            spentByCategory[tx.category] = (spentByCategory[tx.category] ?? 0) + tx.amount
        } else {
            income += tx.amount
        }
    })

    const categoryLine = Object.entries(spentByCategory).sort(
        (a, b) => b[1] - a[1]
    ).map(
        ([category, amount]) => `- ${getCategoryConfig(category as any).label}: ${formatPrice(amount, currency)}`
    ).join("\n")

    const budgetLine = budget ?
        `${formatPrice(thisMonthExpense, currency)} digunakan dari ${formatPrice(budget.amount, currency)}`
        : "Tidak ada budget Bulanan"

    const txLine = recent.slice(0, 30).map(
        (tx) => `${format(new Date(tx.date), "d MMM yyyy")} | ${tx.type} | ${getCategoryConfig(tx.category).label} | ${formatPrice(tx.amount, currency)}${tx.description ? ` | ${tx.description}` : ""}`
    ).join("\n")

    return `Ringkasan 30 hari:
    Total Pemasukan: ${formatPrice(income, currency)}
    Total Pengeluaran: ${formatPrice(expense, currency)}
    
    Pengeluaran by Category: 
    ${categoryLine || "Tidak ada pengeluaran."}
    
    Budget Bulanan:
    ${budgetLine}
    
    Transaksi terakhir:
    ${txLine || "Tidak ada transaksi."}`
}

export async function askAssistant(
    question: string,
    transactions: Transaction[],
    budget: Budget | null,
    currency: string
) {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY
    if (!apiKey) throw new Error("No API KEY provided");

    const context = buildContext(transactions, budget, currency)

    const prompt = `You are a helpful personal finance assistant inside the SakuAI app. Answer the user's question using only the financial data below. Be concise and specific with numbers. If the data doesn't answer the question, say sorry.

${context}

User question: ${question}`;

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                role: "user",
                parts: [{ text: prompt }]
            }],
        })
    })

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini Request Failed, ${errText}`)
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No Response From Gemini');

    return text as string
}