const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
  const defaults = [
    {
      role: "SUPER_ADMIN",
      canViewAll: true, canManageIncome: true, canManageExpenses: true, canManageReceivables: true,
      canManageVentures: true, canManageProjects: true, canManageAssets: true,
      canManageUsers: true, canManageAssemblies: true, canViewReports: true, canExport: true,
    },
    {
      role: "ADMIN",
      canViewAll: true, canManageIncome: true, canManageExpenses: true, canManageReceivables: true,
      canManageVentures: true, canManageProjects: true, canManageAssets: true,
      canManageUsers: false, canManageAssemblies: true, canViewReports: true, canExport: true,
    },
    {
      role: "TREASURER",
      canViewAll: true, canManageIncome: true, canManageExpenses: true, canManageReceivables: true,
      canManageVentures: false, canManageProjects: false, canManageAssets: false,
      canManageUsers: false, canManageAssemblies: false, canViewReports: true, canExport: true,
    },
    {
      role: "ASSEMBLY_LEADER",
      canViewAll: false, canManageIncome: true, canManageExpenses: false, canManageReceivables: false,
      canManageVentures: false, canManageProjects: false, canManageAssets: false,
      canManageUsers: false, canManageAssemblies: false, canViewReports: true, canExport: false,
    },
    {
      role: "VIEWER",
      canViewAll: false, canManageIncome: false, canManageExpenses: false, canManageReceivables: false,
      canManageVentures: false, canManageProjects: false, canManageAssets: false,
      canManageUsers: false, canManageAssemblies: false, canViewReports: true, canExport: false,
    },
  ]

  for (const perm of defaults) {
    await prisma.rolePermission.upsert({
      where: { role: perm.role },
      update: perm,
      create: perm,
    })
  }
  console.log("Seeded role permissions")
}

main().catch(console.error).finally(() => prisma.$disconnect())
