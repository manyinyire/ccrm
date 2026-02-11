-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ECOCASH');

-- CreateTable
CREATE TABLE "Receivable" (
    "id" TEXT NOT NULL,
    "assemblyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "currency" "Currency" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receivable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE CASCADE ON UPDATE CASCADE;
