-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "monthlyFee" BIGINT;
