export function formatPrice (price: number, currency: string = "IDR") {
    const locale = currency === "IDR" ? "id-ID" : undefined

    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(price)
}