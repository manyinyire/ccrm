import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Get the receivable before deleting to check if it's linked to income
    const receivable = await prisma.receivable.findUnique({ where: { id } })
    if (!receivable) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.receivable.delete({ where: { id } })

    // If linked to income, recalculate the income's received/balance
    if (receivable.incomeId) {
      const remaining = await prisma.receivable.findMany({
        where: { incomeId: receivable.incomeId },
      })
      const totalReceived = remaining.reduce((sum, r) => sum + r.amount, 0)
      const income = await prisma.income.findUnique({ where: { id: receivable.incomeId } })
      if (income) {
        await prisma.income.update({
          where: { id: receivable.incomeId },
          data: {
            received: totalReceived,
            balance: income.totalAmount - totalReceived,
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete receivable error:", error)
    return NextResponse.json({ error: "Failed to delete receivable" }, { status: 500 })
  }
}
