import { TransactionFilter } from "../services/transaction";

export const queryKeys = {
    accounts: (userId?: string) => ["accounts", userId] as const,
    transactions: (userId?: string, filters: TransactionFilter = {}) => ["transactions", userId, filters] as const,
    budgets: (userId?: string) => ["budgets", userId] as const
}