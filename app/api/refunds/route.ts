import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const refunds = await prisma.refund.findMany({
    include: {
      expense: { select: { description: true, amount: true } },
      owedPerson: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  })
  return NextResponse.json(refunds)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const refund = await prisma.refund.create({
      data: {
        expenseId: body.expenseId,
        owedPersonId: body.owedPersonId,
        amount: body.amount,
        currency: body.currency,
        date: new Date(body.date),
        note: body.note || "",
      },
    })

    // Update expense status based on total refunds
    const allRefunds = await prisma.refund.findMany({
      where: { expenseId: body.expenseId },
    })
    const totalRefunded = allRefunds.reduce((sum: number, r: { amount: number }) => sum + r.amount, 0)
    const expense = await prisma.expense.findUnique({ where: { id: body.expenseId } })

    if (expense) {
      let newStatus: "OWED" | "PARTIAL" | "PAID" = "OWED"
      if (totalRefunded >= expense.amount) {
        newStatus = "PAID"
      } else if (totalRefunded > 0) {
        newStatus = "PARTIAL"
      }
      await prisma.expense.update({
        where: { id: body.expenseId },
        data: { status: newStatus },
      })
    }

    return NextResponse.json(refund, { status: 201 })
  } catch (error) {
    console.error("Create refund error:", error)
    return NextResponse.json({ error: "Failed to create refund" }, { status: 500 })
  }
}
