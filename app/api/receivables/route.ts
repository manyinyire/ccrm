import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAuditFromSession } from "@/lib/audit"

export async function GET() {
  const records = await prisma.receivable.findMany({
    include: { assembly: { select: { name: true } } },
    orderBy: { date: "desc" },
  })
  const mapped = records.map((r) => ({
    ...r,
    assemblyName: r.assembly.name,
  }))
  return NextResponse.json(mapped)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const record = await prisma.receivable.create({
      data: {
        assemblyId: body.assemblyId,
        date: new Date(body.date),
        currency: body.currency,
        amount: parseFloat(body.amount) || 0,
        paymentMethod: body.paymentMethod,
        sentToPastor: body.sentToPastor || false,
        description: body.description || "",
      },
      include: { assembly: { select: { name: true } } },
    })
    const session = await auth()
    await logAuditFromSession(session, "CREATE", "Receivable", `Created receivable: ${record.currency} ${record.amount} (${record.paymentMethod})`, record.id)

    return NextResponse.json({ ...record, assemblyName: record.assembly.name }, { status: 201 })
  } catch (error) {
    console.error("Create receivable error:", error)
    return NextResponse.json({ error: "Failed to create receivable" }, { status: 500 })
  }
}
