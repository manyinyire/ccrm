import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        incomes: { include: { assembly: true } },
        expenses: { include: { assembly: true } },
      },
    })
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(project)
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json({ error: "Failed to get project" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        budget: body.budget !== undefined ? parseFloat(body.budget) : undefined,
        status: body.status,
      },
    })
    return NextResponse.json(project)
  } catch (error) {
    console.error("Update project error:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Unlink income/expense records (set projectId to null) before deleting
    await prisma.income.updateMany({ where: { projectId: id }, data: { projectId: null } })
    await prisma.expense.updateMany({ where: { projectId: id }, data: { projectId: null } })
    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
