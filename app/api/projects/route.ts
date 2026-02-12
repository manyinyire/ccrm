import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAuditFromSession } from "@/lib/audit"

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { incomes: true, expenses: true } },
    },
  })
  return NextResponse.json(projects)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description || "",
        budget: parseFloat(body.budget) || 0,
      },
    })
    const session = await auth()
    await logAuditFromSession(session, "CREATE", "Project", `Created project: ${project.name}`, project.id)

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
