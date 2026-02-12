import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "50")
  const accountId = searchParams.get("accountId") || ""
  const sourceType = searchParams.get("sourceType") || ""
  const currency = searchParams.get("currency") || ""

  const where: Record<string, unknown> = {}
  if (accountId) {
    where.OR = [{ debitAccountId: accountId }, { creditAccountId: accountId }]
  }
  if (sourceType) where.sourceType = sourceType
  if (currency) where.currency = currency

  const [entries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where,
      include: {
        debitAccount: { select: { code: true, name: true, type: true } },
        creditAccount: { select: { code: true, name: true, type: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.journalEntry.count({ where }),
  ])

  return NextResponse.json({ entries, total, page, limit, totalPages: Math.ceil(total / limit) })
}
