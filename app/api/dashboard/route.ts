import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ZWL_RATE = 28000

function toUSD(amount: number, currency: string): number {
  return currency === "ZWL" ? Math.round(amount / ZWL_RATE) : amount
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const assemblyId = searchParams.get("assemblyId")

  const where = assemblyId && assemblyId !== "all" ? { assemblyId } : {}

  const [incomes, expensesList, assets, owedExpenses, refunds] = await Promise.all([
    prisma.income.findMany({ where }),
    prisma.expense.findMany({ where }),
    prisma.asset.findMany({ where: assemblyId && assemblyId !== "all" ? { assemblyId } : {} }),
    prisma.expense.findMany({ where: { ...where, paymentSource: "OWED_PERSON" } }),
    prisma.refund.findMany(),
  ])

  // Total income (USD equiv)
  const totalIncome = incomes.reduce((sum, r) => sum + toUSD(r.totalAmount, r.currency), 0)
  const totalExpenses = expensesList.reduce((sum, e) => sum + toUSD(e.amount, e.currency), 0)

  // Cash at hand
  const cashInUSD = incomes.filter((r) => r.currency === "USD").reduce((sum, r) => sum + r.received, 0)
  const cashInZWL = incomes.filter((r) => r.currency === "ZWL").reduce((sum, r) => sum + r.received, 0)
  const cashOutUSD = expensesList.filter((e) => e.paymentSource === "CASH_AT_HAND" && e.currency === "USD").reduce((sum, e) => sum + e.amount, 0)
  const cashOutZWL = expensesList.filter((e) => e.paymentSource === "CASH_AT_HAND" && e.currency === "ZWL").reduce((sum, e) => sum + e.amount, 0)
  const cashBalance = (cashInUSD - cashOutUSD) + toUSD(cashInZWL - cashOutZWL, "ZWL")

  // Owed balance
  const owedDebt = owedExpenses.reduce((sum, e) => sum + toUSD(e.amount, e.currency), 0)
  const owedRefund = refunds.reduce((sum, r) => sum + toUSD(r.amount, r.currency), 0)
  const owedBalance = owedDebt - owedRefund

  // Attendance
  const totalAttendance = incomes.reduce((sum, r) => sum + r.adults + r.children, 0)

  // Asset value
  const totalAssetValue = assets.reduce((sum, a) => sum + toUSD(a.currentValue, a.currency), 0)

  return NextResponse.json({
    totalIncome,
    totalExpenses,
    cashBalance,
    cashUSD: cashInUSD - cashOutUSD,
    owedBalance,
    totalAttendance,
    totalAssetValue,
  })
}
