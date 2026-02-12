import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAuditFromSession } from "@/lib/audit"

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
    const session = await auth()
    await logAuditFromSession(session, "CREATE", "Venture", `Created venture: ${venture.name}`, venture.id)

    return NextResponse.json(venture, { status: 201 })
  } catch (error) {
    console.error("Create venture error:", error)
    return NextResponse.json({ error: "Failed to create venture" }, { status: 500 })
  }
}
