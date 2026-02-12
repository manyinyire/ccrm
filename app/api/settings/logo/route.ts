import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("logo") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Limit file size to 500KB
    if (file.size > 500 * 1024) {
      return NextResponse.json({ error: "File too large. Max 500KB." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")
    const mimeType = file.type || "image/png"
    const dataUrl = `data:${mimeType};base64,${base64}`

    // Store in database as a system setting
    await prisma.systemSetting.upsert({
      where: { key: "logoUrl" },
      update: { value: dataUrl },
      create: { key: "logoUrl", value: dataUrl },
    })

    return NextResponse.json({ url: dataUrl })
  } catch (error) {
    console.error("Logo upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
