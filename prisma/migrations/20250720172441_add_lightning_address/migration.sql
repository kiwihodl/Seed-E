-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "lightningAddress" TEXT,
ALTER COLUMN "bolt12Offer" DROP NOT NULL;
