import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAuditFromSession } from "@/lib/audit"

export async function GET() {
  const records = await prisma.income.findMany({
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
    const customItems = body.customItems || {}

    // Separate project amounts from regular custom items
    const projectAmounts: Record<string, number> = {}
    const regularCustomItems: Record<string, number> = {}
    for (const [key, val] of Object.entries(customItems)) {
      const amount = parseFloat(String(val)) || 0
      if (amount === 0) continue
      if (key.startsWith("project:")) {
        projectAmounts[key.replace("project:", "")] = amount
      } else {
        regularCustomItems[key] = amount
      }
    }

    const regularCustomTotal = Object.values(regularCustomItems).reduce((s, v) => s + v, 0)
    const totalAmount =
      (body.offering || 0) +
      (body.tithe || 0) +
      (body.feastBadges || 0) +
      (body.firewood || 0) +
      (body.instruments || 0) +
      (body.pastorsWelfare || 0) +
      regularCustomTotal
    const balance = totalAmount - (body.sentToPastor || 0)

    // Create the main income record (non-project items)
    const record = await prisma.income.create({
      data: {
        assemblyId: body.assemblyId,
        date: new Date(body.date),
        currency: body.currency,
        adults: body.adults || 0,
        children: body.children || 0,
        newSouls: body.newSouls || 0,
        offering: body.offering || 0,
        tithe: body.tithe || 0,
        feastBadges: body.feastBadges || 0,
        firewood: body.firewood || 0,
        instruments: body.instruments || 0,
        pastorsWelfare: body.pastorsWelfare || 0,
        customItems: regularCustomItems,
        totalAmount,
        sentToPastor: body.sentToPastor || 0,
        received: body.received || 0,
        balance,
      },
      include: { assembly: { select: { name: true } } },
    })

    // Create separate income records for each project amount, linked via projectId
    for (const [projectId, amount] of Object.entries(projectAmounts)) {
      await prisma.income.create({
        data: {
          assemblyId: body.assemblyId,
          projectId,
          date: new Date(body.date),
          currency: body.currency,
          adults: 0,
          children: 0,
          newSouls: 0,
          offering: 0,
          tithe: 0,
          feastBadges: 0,
          firewood: 0,
          instruments: 0,
          pastorsWelfare: 0,
          customItems: {},
          totalAmount: amount,
          sentToPastor: 0,
          received: 0,
          balance: amount,
        },
      })
    }

    const session = await auth()
    await logAuditFromSession(session, "CREATE", "Income", `Created income record for ${record.assembly.name} — ${record.currency} ${record.totalAmount}`, record.id)

    return NextResponse.json({ ...record, assemblyName: record.assembly.name }, { status: 201 })
  } catch (error) {
    console.error("Create income error:", error)
    return NextResponse.json({ error: "Failed to create income record" }, { status: 500 })
  }
}
