import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const expense = await prisma.ventureExpense.create({
      data: {
        ventureId: id,
        date: new Date(body.date),
        currency: body.currency,
        amount: parseFloat(body.amount) || 0,
        description: body.description || "",
      },
    })
    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error("Create venture expense error:", error)
    return NextResponse.json({ error: "Failed to create venture expense" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const expenseId = searchParams.get("expenseId")
  if (!expenseId) return NextResponse.json({ error: "expenseId required" }, { status: 400 })
  await prisma.ventureExpense.delete({ where: { id: expenseId } })
  return NextResponse.json({ success: true })
}
