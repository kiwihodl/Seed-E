/*
  Warnings:

  - Added the required column `unlocksAt` to the `SignatureRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "penaltyCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "minTimeDelay" INTEGER NOT NULL DEFAULT 168;

-- AlterTable
ALTER TABLE "SignatureRequest" ADD COLUMN     "signedAt" TIMESTAMP(3),
ADD COLUMN     "unlocksAt" TIMESTAMP(3) NOT NULL;
