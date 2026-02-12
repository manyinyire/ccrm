import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAuditFromSession } from "@/lib/audit"

export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      assemblyId: true,
      assembly: { select: { name: true } },
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  })
  const mapped = users.map((u) => ({
    ...u,
    assemblyName: u.assembly?.name || null,
  }))
  return NextResponse.json(mapped)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    const hashedPassword = await hash(body.password, 12)
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: body.role?.toUpperCase() || "VIEWER",
        assemblyId: body.assemblyId || null,
        status: "active",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assemblyId: true,
        status: true,
        createdAt: true,
      },
    })
    const session = await auth()
    await logAuditFromSession(session, "CREATE", "User", `Created user: ${user.name} (${user.email}) with role ${user.role}`, user.id)

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
