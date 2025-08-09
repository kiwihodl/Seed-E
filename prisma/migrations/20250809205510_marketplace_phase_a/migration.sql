-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('ONE_TIME', 'MANAGED');

-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'REQUESTED';

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "keybaseHandle" TEXT,
ADD COLUMN     "materialsCatalog" JSONB,
ADD COLUMN     "shippingPolicyDefault" JSONB;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "materialsOverrides" JSONB,
ADD COLUMN     "serviceType" "ServiceType" NOT NULL DEFAULT 'ONE_TIME',
ADD COLUMN     "shippingOverrides" JSONB;

-- AlterTable
ALTER TABLE "ServicePurchase" ADD COLUMN     "orderConfig" JSONB,
ADD COLUMN     "pricingBreakdown" JSONB,
ADD COLUMN     "shipments" JSONB,
ADD COLUMN     "years" INTEGER;
