import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const currency = searchParams.get("currency") || "USD"

  const accounts = await prisma.account.findMany({
    orderBy: { code: "asc" },
  })

  const entries = await prisma.journalEntry.findMany({
    where: { currency: currency as "USD" | "ZWL" },
    select: { debitAccountId: true, creditAccountId: true, amount: true },
  })

  // Calculate debit/credit totals per account
  const accountTotals: Record<string, { debit: number; credit: number }> = {}
  for (const acc of accounts) {
    accountTotals[acc.id] = { debit: 0, credit: 0 }
  }

  for (const entry of entries) {
    if (accountTotals[entry.debitAccountId]) {
      accountTotals[entry.debitAccountId].debit += entry.amount
    }
    if (accountTotals[entry.creditAccountId]) {
      accountTotals[entry.creditAccountId].credit += entry.amount
    }
  }

  // Build trial balance rows (only accounts with activity)
  const rows = accounts
    .filter((acc) => {
      const t = accountTotals[acc.id]
      return t && (t.debit > 0 || t.credit > 0)
    })
    .map((acc) => {
      const t = accountTotals[acc.id]
      // For ASSET and EXPENSE accounts: normal balance is debit
      // For LIABILITY, EQUITY, REVENUE: normal balance is credit
      const isDebitNormal = acc.type === "ASSET" || acc.type === "EXPENSE"
      const balance = isDebitNormal ? t.debit - t.credit : t.credit - t.debit
      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debit: t.debit,
        credit: t.credit,
        balance,
        normalSide: isDebitNormal ? "debit" : "credit",
      }
    })

  const totalDebits = rows.reduce((sum, r) => sum + r.debit, 0)
  const totalCredits = rows.reduce((sum, r) => sum + r.credit, 0)
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

  return NextResponse.json({
    rows,
    totalDebits,
    totalCredits,
    isBalanced,
    currency,
  })
}
