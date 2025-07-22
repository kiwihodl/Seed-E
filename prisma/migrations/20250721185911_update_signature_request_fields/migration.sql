/*
  Warnings:

  - You are about to drop the column `fee` on the `SignatureRequest` table. All the data in the column will be lost.
  - You are about to drop the column `signedPsbt` on the `SignatureRequest` table. All the data in the column will be lost.
  - You are about to drop the column `unsignedPsbt` on the `SignatureRequest` table. All the data in the column will be lost.
  - Added the required column `psbtData` to the `SignatureRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signatureFee` to the `SignatureRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SignatureRequest" DROP COLUMN "fee",
DROP COLUMN "signedPsbt",
DROP COLUMN "unsignedPsbt",
ADD COLUMN     "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentHash" TEXT,
ADD COLUMN     "psbtData" TEXT NOT NULL,
ADD COLUMN     "psbtHash" TEXT,
ADD COLUMN     "signatureFee" BIGINT NOT NULL,
ADD COLUMN     "signedPsbtData" TEXT;
