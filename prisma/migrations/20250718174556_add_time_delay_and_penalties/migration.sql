-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "penaltyCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "minTimeDelay" INTEGER NOT NULL DEFAULT 168;

