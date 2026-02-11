import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const permissions = await prisma.rolePermission.findMany({ orderBy: { role: "asc" } })
  return NextResponse.json(permissions)
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { role, ...data } = body
    const permission = await prisma.rolePermission.upsert({
      where: { role },
      update: data,
      create: { role, ...data },
    })
    return NextResponse.json(permission)
  } catch (error) {
    console.error("Update permission error:", error)
    return NextResponse.json({ error: "Failed to update permission" }, { status: 500 })
  }
}
