-- CreateEnum
CREATE TYPE "VentureStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Venture" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "VentureStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentureExpense" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "currency" "Currency" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VentureExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentureAllocation" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "assemblyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "currency" "Currency" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VentureAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenturePayment" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "assemblyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "currency" "Currency" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenturePayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VentureExpense" ADD CONSTRAINT "VentureExpense_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentureAllocation" ADD CONSTRAINT "VentureAllocation_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentureAllocation" ADD CONSTRAINT "VentureAllocation_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenturePayment" ADD CONSTRAINT "VenturePayment_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenturePayment" ADD CONSTRAINT "VenturePayment_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE CASCADE ON UPDATE CASCADE;
