import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const settings = await prisma.systemSetting.findMany()
  const map: Record<string, string> = {}
  for (const s of settings) {
    map[s.key] = s.value
  }
  return NextResponse.json(map)
}

export async function PUT(req: Request) {
  const body = await req.json()
  const entries = Object.entries(body) as [string, string][]

  for (const [key, value] of entries) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  return NextResponse.json({ success: true })
}
