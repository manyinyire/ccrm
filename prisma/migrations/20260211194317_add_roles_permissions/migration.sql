-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ASSEMBLY_LEADER';

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "canViewAll" BOOLEAN NOT NULL DEFAULT false,
    "canManageIncome" BOOLEAN NOT NULL DEFAULT false,
    "canManageExpenses" BOOLEAN NOT NULL DEFAULT false,
    "canManageReceivables" BOOLEAN NOT NULL DEFAULT false,
    "canManageVentures" BOOLEAN NOT NULL DEFAULT false,
    "canManageProjects" BOOLEAN NOT NULL DEFAULT false,
    "canManageAssets" BOOLEAN NOT NULL DEFAULT false,
    "canManageUsers" BOOLEAN NOT NULL DEFAULT false,
    "canManageAssemblies" BOOLEAN NOT NULL DEFAULT false,
    "canViewReports" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_key" ON "RolePermission"("role");
