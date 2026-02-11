import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const assembly = await prisma.assembly.update({
      where: { id },
      data: {
        name: body.name,
        location: body.location,
        leader: body.leader,
        status: body.status,
      },
    })
    return NextResponse.json(assembly)
  } catch (error) {
    console.error("Update assembly error:", error)
    return NextResponse.json({ error: "Failed to update assembly" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.assembly.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete assembly error:", error)
    return NextResponse.json({ error: "Failed to delete assembly" }, { status: 500 })
  }
}
