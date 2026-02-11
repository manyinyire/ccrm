import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const ventures = await prisma.venture.findMany({
    include: {
      products: true,
      expenses: true,
      allocations: { include: { assembly: { select: { name: true } }, product: { select: { name: true } } } },
      payments: { include: { assembly: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(ventures)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const venture = await prisma.venture.create({
      data: {
        name: body.name,
        description: body.description || "",
        status: body.status || "ACTIVE",
      },
    })
    return NextResponse.json(venture, { status: 201 })
  } catch (error) {
    console.error("Create venture error:", error)
    return NextResponse.json({ error: "Failed to create venture" }, { status: 500 })
  }
}
