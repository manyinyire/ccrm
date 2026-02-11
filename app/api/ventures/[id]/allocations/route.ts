import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const qty = parseInt(body.quantity) || 0
    const price = parseFloat(body.unitPrice) || 0

    // If a product is selected, deduct stock
    if (body.productId) {
      const product = await prisma.ventureProduct.findUnique({ where: { id: body.productId } })
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
      if (product.stock < qty) return NextResponse.json({ error: `Insufficient stock. Available: ${product.stock}` }, { status: 400 })
      await prisma.ventureProduct.update({
        where: { id: body.productId },
        data: { stock: { decrement: qty } },
      })
    }

    const allocation = await prisma.ventureAllocation.create({
      data: {
        ventureId: id,
        productId: body.productId || null,
        assemblyId: body.assemblyId,
        date: new Date(body.date),
        currency: body.currency,
        quantity: qty,
        unitPrice: price,
        totalAmount: qty * price,
        description: body.description || "",
      },
      include: { assembly: { select: { name: true } }, product: { select: { name: true } } },
    })
    return NextResponse.json(allocation, { status: 201 })
  } catch (error) {
    console.error("Create venture allocation error:", error)
    return NextResponse.json({ error: "Failed to create allocation" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const allocationId = searchParams.get("allocationId")
  if (!allocationId) return NextResponse.json({ error: "allocationId required" }, { status: 400 })

  // Restore stock if allocation had a product
  const allocation = await prisma.ventureAllocation.findUnique({ where: { id: allocationId } })
  if (allocation?.productId) {
    await prisma.ventureProduct.update({
      where: { id: allocation.productId },
      data: { stock: { increment: allocation.quantity } },
    })
  }

  await prisma.ventureAllocation.delete({ where: { id: allocationId } })
  return NextResponse.json({ success: true })
}
