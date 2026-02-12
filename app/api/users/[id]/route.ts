import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAuditFromSession } from "@/lib/audit"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        role: body.role?.toUpperCase(),
        assemblyId: body.assemblyId || null,
        status: body.status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assemblyId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    const session = await auth()
    await logAuditFromSession(session, "UPDATE", "User", `Updated user: ${user.name} (${user.email})`, user.id)

    return NextResponse.json(user)
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({ where: { id }, select: { name: true, email: true } })
    await prisma.user.delete({ where: { id } })

    const session = await auth()
    await logAuditFromSession(session, "DELETE", "User", `Deleted user: ${user?.name} (${user?.email})`, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
