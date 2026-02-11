-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Income" ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
