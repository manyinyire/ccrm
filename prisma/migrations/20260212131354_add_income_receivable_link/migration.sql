-- AlterTable
ALTER TABLE "Receivable" ADD COLUMN     "incomeId" TEXT;

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_incomeId_fkey" FOREIGN KEY ("incomeId") REFERENCES "Income"("id") ON DELETE SET NULL ON UPDATE CASCADE;
