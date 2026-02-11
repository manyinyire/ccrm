import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const categories = await prisma.expenseCategory.findMany({ orderBy: { sortOrder: "asc" } })
  return NextResponse.json(categories)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const maxOrder = await prisma.expenseCategory.aggregate({ _max: { sortOrder: true } })
    const category = await prisma.expenseCategory.create({
      data: {
        name: body.name,
        isDefault: false,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Create expense category error:", error)
    return NextResponse.json({ error: "Failed to create expense category" }, { status: 500 })
  }
}
