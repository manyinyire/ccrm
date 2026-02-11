import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const assets = await prisma.asset.findMany({
    include: { assembly: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })
  const mapped = assets.map((a) => ({
    ...a,
    assemblyName: a.assembly.name,
  }))
  return NextResponse.json(mapped)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const asset = await prisma.asset.create({
      data: {
        name: body.name,
        category: body.category?.toUpperCase(),
        assemblyId: body.assemblyId,
        purchaseDate: new Date(body.purchaseDate),
        purchasePrice: body.purchasePrice,
        currency: body.currency,
        currentValue: body.currentValue ?? body.purchasePrice,
        condition: body.condition?.toUpperCase(),
        location: body.location,
        assignedTo: body.assignedTo || null,
        serialNumber: body.serialNumber || null,
        notes: body.notes || null,
      },
      include: { assembly: { select: { name: true } } },
    })
    return NextResponse.json({ ...asset, assemblyName: asset.assembly.name }, { status: 201 })
  } catch (error) {
    console.error("Create asset error:", error)
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 })
  }
}
