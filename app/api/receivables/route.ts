import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAuditFromSession } from "@/lib/audit"
import { journalForReceivable } from "@/lib/journal"

export async function GET() {
  const records = await prisma.receivable.findMany({
    include: {
      assembly: { select: { name: true } },
      income: { select: { id: true, date: true, totalAmount: true, received: true, balance: true } },
    },
    orderBy: { date: "desc" },
  })
  const mapped = records.map((r) => ({
    ...r,
    assemblyName: r.assembly.name,
    incomeDate: r.income?.date || null,
    incomeTotalAmount: r.income?.totalAmount || null,
  }))
  return NextResponse.json(mapped)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const amount = parseFloat(body.amount) || 0

    const record = await prisma.receivable.create({
      data: {
        assemblyId: body.assemblyId,
        incomeId: body.incomeId || null,
        date: new Date(body.date),
        currency: body.currency,
        amount,
        paymentMethod: body.paymentMethod,
        sentToPastor: body.sentToPastor || false,
        description: body.description || "",
      },
      include: { assembly: { select: { name: true } } },
    })

    // If linked to an income record, update its received/balance fields
    if (body.incomeId) {
      const allRecForIncome = await prisma.receivable.findMany({
        where: { incomeId: body.incomeId },
      })
      const totalReceived = allRecForIncome.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0)
      const income = await prisma.income.findUnique({ where: { id: body.incomeId } })
      if (income) {
        await prisma.income.update({
          where: { id: body.incomeId },
          data: {
            received: totalReceived,
            balance: income.totalAmount - totalReceived,
          },
        })
      }
    }

    await journalForReceivable({
      id: record.id,
      assemblyId: record.assemblyId,
      date: record.date,
      currency: record.currency as "USD" | "ZWL",
      amount: record.amount,
      paymentMethod: record.paymentMethod,
      sentToPastor: record.sentToPastor,
    })

    const session = await auth()
    await logAuditFromSession(session, "CREATE", "Receivable", `Created receivable: ${record.currency} ${record.amount} (${record.paymentMethod})`, record.id)

    return NextResponse.json({ ...record, assemblyName: record.assembly.name }, { status: 201 })
  } catch (error) {
    console.error("Create receivable error:", error)
    return NextResponse.json({ error: "Failed to create receivable" }, { status: 500 })
  }
}
