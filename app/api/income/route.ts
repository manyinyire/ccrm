import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
    const customTotal = Object.values(customItems).reduce((s: number, v: any) => s + (parseFloat(v) || 0), 0)
    const totalAmount =
      (body.offering || 0) +
      (body.tithe || 0) +
      (body.feastBadges || 0) +
      (body.firewood || 0) +
      (body.instruments || 0) +
      (body.pastorsWelfare || 0) +
      customTotal
    const balance = totalAmount - (body.sentToPastor || 0)

    const record = await prisma.income.create({
      data: {
        assemblyId: body.assemblyId,
        projectId: body.projectId || null,
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
        customItems: customItems,
        totalAmount,
        sentToPastor: body.sentToPastor || 0,
        received: body.received || 0,
        balance,
      },
      include: { assembly: { select: { name: true } } },
    })
    return NextResponse.json({ ...record, assemblyName: record.assembly.name }, { status: 201 })
  } catch (error) {
    console.error("Create income error:", error)
    return NextResponse.json({ error: "Failed to create income record" }, { status: 500 })
  }
}
