import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const venture = await prisma.venture.findUnique({
    where: { id },
    include: {
      expenses: { orderBy: { date: "desc" } },
      allocations: { include: { assembly: { select: { name: true } } }, orderBy: { date: "desc" } },
      payments: { include: { assembly: { select: { name: true } } }, orderBy: { date: "desc" } },
    },
  })
  if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(venture)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const venture = await prisma.venture.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      status: body.status,
    },
  })
  return NextResponse.json(venture)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.venture.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
