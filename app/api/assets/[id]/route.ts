import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const asset = await prisma.asset.update({
      where: { id },
      data: {
        name: body.name,
        category: body.category?.toUpperCase(),
        assemblyId: body.assemblyId,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        purchasePrice: body.purchasePrice,
        currency: body.currency,
        currentValue: body.currentValue,
        condition: body.condition?.toUpperCase(),
        location: body.location,
        assignedTo: body.assignedTo || null,
        serialNumber: body.serialNumber || null,
        notes: body.notes || null,
      },
    })
    return NextResponse.json(asset)
  } catch (error) {
    console.error("Update asset error:", error)
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.asset.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete asset error:", error)
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 })
  }
}
