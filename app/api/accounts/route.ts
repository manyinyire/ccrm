import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const accounts = await prisma.account.findMany({
    include: { children: { select: { id: true, code: true, name: true, type: true } } },
    orderBy: { code: "asc" },
  })
  return NextResponse.json(accounts)
}
