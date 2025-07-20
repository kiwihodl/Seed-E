/*
  Warnings:

  - You are about to drop the column `paymentHash` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionExpiresAt` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `xpub` on the `Service` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[xpubHash]` on the table `Service` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `xpubHash` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fee` to the `SignatureRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceId` to the `SignatureRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_serviceId_fkey";

-- DropIndex
DROP INDEX "Client_paymentHash_key";

-- DropIndex
DROP INDEX "Service_xpub_key";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "paymentHash",
DROP COLUMN "serviceId",
DROP COLUMN "subscriptionExpiresAt",
ADD COLUMN     "recoveryKey" TEXT;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "recoveryKey" TEXT;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "xpub",
ADD COLUMN     "encryptedXpub" TEXT,
ADD COLUMN     "isPurchased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "xpubHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SignatureRequest" ADD COLUMN     "fee" BIGINT NOT NULL,
ADD COLUMN     "serviceId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ServicePurchase" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "paymentHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServicePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "subscriptionType" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "nip47Request" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "SubscriptionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServicePurchase_paymentHash_key" ON "ServicePurchase"("paymentHash");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePurchase_clientId_serviceId_key" ON "ServicePurchase"("clientId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_xpubHash_key" ON "Service"("xpubHash");

-- AddForeignKey
ALTER TABLE "ServicePurchase" ADD CONSTRAINT "ServicePurchase_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePurchase" ADD CONSTRAINT "ServicePurchase_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRequest" ADD CONSTRAINT "SignatureRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionRequest" ADD CONSTRAINT "SubscriptionRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionRequest" ADD CONSTRAINT "SubscriptionRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
