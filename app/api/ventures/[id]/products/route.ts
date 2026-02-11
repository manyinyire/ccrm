import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const product = await prisma.ventureProduct.create({
      data: {
        ventureId: id,
        name: body.name,
        currency: body.currency,
        unitPrice: parseFloat(body.unitPrice) || 0,
        stock: parseInt(body.stock) || 0,
      },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Create venture product error:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("productId")
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })
  const body = await req.json()
  const product = await prisma.ventureProduct.update({
    where: { id: productId },
    data: {
      name: body.name,
      currency: body.currency,
      unitPrice: parseFloat(body.unitPrice) || 0,
      stock: parseInt(body.stock) || 0,
    },
  })
  return NextResponse.json(product)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("productId")
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })
  await prisma.ventureProduct.delete({ where: { id: productId } })
  return NextResponse.json({ success: true })
}
