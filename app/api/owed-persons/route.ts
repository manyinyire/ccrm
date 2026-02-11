import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const persons = await prisma.owedPerson.findMany({
    orderBy: { name: "asc" },
  })
  return NextResponse.json(persons)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const person = await prisma.owedPerson.create({
      data: {
        name: body.name,
        phone: body.phone || "",
        role: body.role || "",
      },
    })
    return NextResponse.json(person, { status: 201 })
  } catch (error) {
    console.error("Create owed person error:", error)
    return NextResponse.json({ error: "Failed to create owed person" }, { status: 500 })
  }
}
