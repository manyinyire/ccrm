import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAuditFromSession } from "@/lib/audit"

export async function GET() {
  const assemblies = await prisma.assembly.findMany({
    orderBy: { name: "asc" },
  })
  return NextResponse.json(assemblies)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const assembly = await prisma.assembly.create({
      data: {
        name: body.name,
        location: body.location,
        leader: body.leader,
        status: body.status?.toUpperCase() || "ACTIVE",
      },
    })
    const session = await auth()
    await logAuditFromSession(session, "CREATE", "Assembly", `Created assembly: ${assembly.name} (${assembly.location})`, assembly.id)

    return NextResponse.json(assembly, { status: 201 })
  } catch (error) {
    console.error("Create assembly error:", error)
    return NextResponse.json({ error: "Failed to create assembly" }, { status: 500 })
  }
}
