import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const items = await prisma.incomeItem.findMany({ orderBy: { sortOrder: "asc" } })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const maxOrder = await prisma.incomeItem.aggregate({ _max: { sortOrder: true } })
    const item = await prisma.incomeItem.create({
      data: {
        name: body.name,
        isDefault: false,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Create income item error:", error)
    return NextResponse.json({ error: "Failed to create income item" }, { status: 500 })
  }
}
