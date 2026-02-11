import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
    return NextResponse.json(assembly, { status: 201 })
  } catch (error) {
    console.error("Create assembly error:", error)
    return NextResponse.json({ error: "Failed to create assembly" }, { status: 500 })
  }
}
