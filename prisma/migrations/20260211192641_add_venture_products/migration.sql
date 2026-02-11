-- AlterTable
ALTER TABLE "VentureAllocation" ADD COLUMN     "productId" TEXT;

-- CreateTable
CREATE TABLE "VentureProduct" (
    "id" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VentureProduct_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VentureProduct" ADD CONSTRAINT "VentureProduct_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentureAllocation" ADD CONSTRAINT "VentureAllocation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "VentureProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
