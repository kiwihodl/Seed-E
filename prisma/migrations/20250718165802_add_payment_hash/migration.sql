/*
  Warnings:

  - A unique constraint covering the columns `[paymentHash]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "paymentHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_paymentHash_key" ON "Client"("paymentHash");
