import { prisma } from "@/lib/prisma"

// Account code constants matching seed-accounts.js
export const ACCOUNTS = {
  // Assets
  CASH_AT_HAND: "1100",
  BANK_ECOCASH: "1200",
  ACCOUNTS_RECEIVABLE: "1300",
  FIXED_ASSETS: "1400",
  VENTURE_INVENTORY: "1500",
  // Liabilities
  ACCOUNTS_PAYABLE: "2100",
  PASTOR_REMITTANCE: "2200",
  // Equity
  GENERAL_FUND: "3100",
  PROJECT_FUNDS: "3200",
  // Revenue
  OFFERINGS: "4100",
  TITHES: "4200",
  FEAST_BADGES: "4300",
  FIREWOOD: "4400",
  INSTRUMENTS: "4500",
  PASTORS_WELFARE: "4600",
  OTHER_INCOME: "4700",
  PROJECT_INCOME: "4800",
  VENTURE_REVENUE: "4900",
  // Expenses
  GENERAL_EXPENSES: "5100",
  PROJECT_EXPENSES: "5200",
  VENTURE_EXPENSES: "5300",
  REFUNDS_PAID: "5400",
} as const

// Cache account IDs to avoid repeated DB lookups
const accountIdCache: Record<string, string> = {}

async function getAccountId(code: string): Promise<string> {
  if (accountIdCache[code]) return accountIdCache[code]
  const account = await prisma.account.findUnique({ where: { code } })
  if (!account) throw new Error(`Account ${code} not found. Run seed-accounts.js first.`)
  accountIdCache[code] = account.id
  return account.id
}

type JournalInput = {
  date: Date
  debitCode: string
  creditCode: string
  amount: number
  currency: "USD" | "ZWL"
  description: string
  reference?: string
  sourceType?: string
  sourceId?: string
  assemblyId?: string
}

export async function createJournalEntry(input: JournalInput) {
  if (input.amount <= 0) return null
  try {
    const [debitAccountId, creditAccountId] = await Promise.all([
      getAccountId(input.debitCode),
      getAccountId(input.creditCode),
    ])
    return await prisma.journalEntry.create({
      data: {
        date: input.date,
        debitAccountId,
        creditAccountId,
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        reference: input.reference || "",
        sourceType: input.sourceType || "",
        sourceId: input.sourceId || "",
        assemblyId: input.assemblyId || null,
      },
    })
  } catch (e) {
    console.error("Journal entry error:", e)
    return null
  }
}

export async function createMultipleJournalEntries(entries: JournalInput[]) {
  const results = []
  for (const entry of entries) {
    const result = await createJournalEntry(entry)
    if (result) results.push(result)
  }
  return results
}

// ─── Transaction-specific journal entry creators ────────────────

/**
 * Income recorded by assembly:
 *   DR Accounts Receivable (assembly owes HQ)
 *   CR Revenue accounts (offerings, tithes, etc.)
 */
export async function journalForIncome(record: {
  id: string
  assemblyId: string
  date: Date | string
  currency: "USD" | "ZWL"
  offering: number
  tithe: number
  feastBadges: number
  firewood: number
  instruments: number
  pastorsWelfare: number
  customItems: Record<string, number>
  totalAmount: number
  projectId?: string | null
}) {
  const date = new Date(record.date)
  const currency = record.currency as "USD" | "ZWL"
  const base = {
    date,
    currency,
    sourceType: "Income",
    sourceId: record.id,
    assemblyId: record.assemblyId,
  }

  // Project income
  if (record.projectId) {
    return createJournalEntry({
      ...base,
      debitCode: ACCOUNTS.ACCOUNTS_RECEIVABLE,
      creditCode: ACCOUNTS.PROJECT_INCOME,
      amount: record.totalAmount,
      description: `Project income from assembly`,
      reference: `INC-${record.id.slice(-6)}`,
    })
  }

  // Regular income — create individual entries per category
  const entries: JournalInput[] = []

  const lineItems: [number, string, string][] = [
    [record.offering, ACCOUNTS.OFFERINGS, "Offering"],
    [record.tithe, ACCOUNTS.TITHES, "Tithe"],
    [record.feastBadges, ACCOUNTS.FEAST_BADGES, "Feast badges"],
    [record.firewood, ACCOUNTS.FIREWOOD, "Firewood"],
    [record.instruments, ACCOUNTS.INSTRUMENTS, "Instruments"],
    [record.pastorsWelfare, ACCOUNTS.PASTORS_WELFARE, "Pastor's welfare"],
  ]

  for (const [amount, creditCode, label] of lineItems) {
    if (amount > 0) {
      entries.push({
        ...base,
        debitCode: ACCOUNTS.ACCOUNTS_RECEIVABLE,
        creditCode,
        amount,
        description: `${label}`,
        reference: `INC-${record.id.slice(-6)}`,
      })
    }
  }

  // Custom items
  const customTotal = Object.values(record.customItems || {}).reduce((s, v) => s + (v as number), 0)
  if (customTotal > 0) {
    entries.push({
      ...base,
      debitCode: ACCOUNTS.ACCOUNTS_RECEIVABLE,
      creditCode: ACCOUNTS.OTHER_INCOME,
      amount: customTotal,
      description: `Custom income items`,
      reference: `INC-${record.id.slice(-6)}`,
    })
  }

  return createMultipleJournalEntries(entries)
}

/**
 * Receivable (money received from assembly):
 *   DR Cash at Hand / Bank
 *   CR Accounts Receivable
 *
 * If sentToPastor:
 *   DR Pastor Remittance Payable
 *   CR Cash at Hand (money leaves cash)
 */
export async function journalForReceivable(record: {
  id: string
  assemblyId: string
  date: Date | string
  currency: "USD" | "ZWL"
  amount: number
  paymentMethod: string
  sentToPastor: boolean
}) {
  const date = new Date(record.date)
  const currency = record.currency as "USD" | "ZWL"
  const cashAccount = record.paymentMethod === "ECOCASH" ? ACCOUNTS.BANK_ECOCASH : ACCOUNTS.CASH_AT_HAND
  const base = { date, currency, sourceType: "Receivable", sourceId: record.id, assemblyId: record.assemblyId }

  const entries: JournalInput[] = []

  // Money received: DR Cash, CR Accounts Receivable
  entries.push({
    ...base,
    debitCode: cashAccount,
    creditCode: ACCOUNTS.ACCOUNTS_RECEIVABLE,
    amount: record.amount,
    description: `Received from assembly`,
    reference: `REC-${record.id.slice(-6)}`,
  })

  // If sent to pastor: DR Pastor Remittance, CR Cash (money forwarded)
  if (record.sentToPastor) {
    entries.push({
      ...base,
      debitCode: ACCOUNTS.PASTOR_REMITTANCE,
      creditCode: cashAccount,
      amount: record.amount,
      description: `Forwarded to pastor`,
      reference: `REC-${record.id.slice(-6)}`,
    })
  }

  return createMultipleJournalEntries(entries)
}

/**
 * Expense paid from cash:
 *   DR Expense account
 *   CR Cash at Hand
 *
 * Expense owed to person:
 *   DR Expense account
 *   CR Accounts Payable
 */
export async function journalForExpense(record: {
  id: string
  assemblyId: string
  date: Date | string
  currency: "USD" | "ZWL"
  amount: number
  paymentSource: string
  projectId?: string | null
  description: string
}) {
  const date = new Date(record.date)
  const currency = record.currency as "USD" | "ZWL"

  const debitCode = record.projectId ? ACCOUNTS.PROJECT_EXPENSES : ACCOUNTS.GENERAL_EXPENSES
  let creditCode: string
  if (record.paymentSource === "OWED_PERSON") {
    creditCode = ACCOUNTS.ACCOUNTS_PAYABLE
  } else if (record.paymentSource === "ECOCASH") {
    creditCode = ACCOUNTS.BANK_ECOCASH
  } else {
    creditCode = ACCOUNTS.CASH_AT_HAND
  }

  return createJournalEntry({
    date,
    debitCode,
    creditCode,
    amount: record.amount,
    currency,
    description: record.description,
    reference: `EXP-${record.id.slice(-6)}`,
    sourceType: "Expense",
    sourceId: record.id,
    assemblyId: record.assemblyId,
  })
}

/**
 * Refund to owed person:
 *   DR Accounts Payable (reduce liability)
 *   CR Cash at Hand (cash goes out)
 */
export async function journalForRefund(record: {
  id: string
  date: Date | string
  currency: "USD" | "ZWL"
  amount: number
  expenseId: string
}) {
  return createJournalEntry({
    date: new Date(record.date),
    debitCode: ACCOUNTS.ACCOUNTS_PAYABLE,
    creditCode: ACCOUNTS.CASH_AT_HAND,
    amount: record.amount,
    currency: record.currency as "USD" | "ZWL",
    description: `Refund payment`,
    reference: `REF-${record.id.slice(-6)}`,
    sourceType: "Refund",
    sourceId: record.id,
  })
}
