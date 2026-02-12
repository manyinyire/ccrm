import { prisma } from "@/lib/prisma"

type AuditInput = {
  userId: string
  userName: string
  userEmail: string
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT"
  entity: string
  entityId?: string
  description: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}

export async function logAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        userName: input.userName,
        userEmail: input.userEmail,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId || null,
        description: input.description,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : {},
        ipAddress: input.ipAddress || "",
      },
    })
  } catch (e) {
    console.error("Audit log error:", e)
  }
}

export async function logAuditFromSession(
  session: { user?: { id?: string; name?: string | null; email?: string | null } } | null,
  action: AuditInput["action"],
  entity: string,
  description: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  if (!session?.user) return
  await logAudit({
    userId: session.user.id || "unknown",
    userName: session.user.name || "Unknown",
    userEmail: session.user.email || "unknown",
    action,
    entity,
    entityId,
    description,
    metadata,
  })
}
