import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const payment = await prisma.venturePayment.create({
      data: {
        ventureId: id,
        assemblyId: body.assemblyId,
        date: new Date(body.date),
        currency: body.currency,
        amount: parseFloat(body.amount) || 0,
        paymentMethod: body.paymentMethod,
        description: body.description || "",
      },
      include: { assembly: { select: { name: true } } },
    })
    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error("Create venture payment error:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const paymentId = searchParams.get("paymentId")
  if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 })
  await prisma.venturePayment.delete({ where: { id: paymentId } })
  return NextResponse.json({ success: true })
}
