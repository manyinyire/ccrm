import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAuditFromSession } from "@/lib/audit"

export async function GET() {
  const records = await prisma.expense.findMany({
    include: {
      assembly: { select: { name: true } },
      owedPerson: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  })
  const mapped = records.map((r) => ({
    ...r,
    assemblyName: r.assembly.name,
    owedPersonName: r.owedPerson?.name || null,
  }))
  return NextResponse.json(mapped)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const record = await prisma.expense.create({
      data: {
        assemblyId: body.assemblyId,
        projectId: body.projectId || null,
        date: new Date(body.date),
        currency: body.currency,
        event: body.event,
        description: body.description,
        category: body.category || "",
        amount: body.amount,
        paidTo: body.paidTo,
        paymentSource: body.paymentSource,
        owedPersonId: body.owedPersonId || null,
        status: body.paymentSource === "OWED_PERSON" ? "OWED" : (body.status || "PAID"),
      },
      include: {
        assembly: { select: { name: true } },
        owedPerson: { select: { id: true, name: true } },
      },
    })
    const session = await auth()
    await logAuditFromSession(session, "CREATE", "Expense", `Created expense: ${record.description} — ${record.currency} ${record.amount}`, record.id)

    return NextResponse.json(
      { ...record, assemblyName: record.assembly.name, owedPersonName: record.owedPerson?.name || null },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create expense error:", error)
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}
