import { format } from "date-fns"
import { Directory, File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { Transaction } from "./services/transaction"

export function formatPrice(price: number, currency: string = "IDR") {
    const locale = currency === "IDR" ? "id-ID" : undefined

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(price)
}

const EXPORT_WINDOW_DAYS = 30

function toCsvCell(value: string | number | null) {
    if (value === null) return ""
    const str = String(value)
    if (/[", n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
    return str
}

function buildCsv(transactions: Transaction[]) {
    const header = [
        "Tanggal",
        "Tipe",
        "Kategori",
        "Deskripsi",
        "Jumlah",
        "Metode"
    ]

    const rows = transactions.map((tx) => [
        format(new Date(), 'yyy-MM-dd'),
        tx.type,
        tx.category,
        tx.description,
        tx.amount,
        tx.input_method
    ])

    return [header, ...rows]
        .map((row) => row.map(toCsvCell).join(","))
        .join("\n")
}

export const exportTransactionsToCSV = async (transactions: Transaction[]) => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - EXPORT_WINDOW_DAYS)

    const recentTransactions = transactions.filter(
        (tx) => new Date(tx.date) >= cutoff
    )

    const csv = buildCsv(recentTransactions)

    const fileName = `transaksi-${format(new Date(), "yyyy-MM-dd")}.csv`
    const file = new File(new Directory(Paths.cache), fileName)

    if (file.exists) file.delete()
    file.create()
    file.write(csv)

    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(
            file.uri,
            {
                mimeType: "text/csv",
                dialogTitle: "Export Transaksi",
                UTI: "public.comma-separated-values-text"
            }
        )
    }

    return { count: recentTransactions.length, uri: file.uri }
}