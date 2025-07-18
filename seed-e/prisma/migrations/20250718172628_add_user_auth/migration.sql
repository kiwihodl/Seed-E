/*
  Warnings:

  - You are about to drop the column `clientId` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Provider` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `Provider` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `Provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `Provider` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Client_clientId_key";

-- DropIndex
DROP INDEX "Provider_name_key";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "clientId",
ADD COLUMN     "twoFactorSecret" TEXT,
ADD COLUMN     "username" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "name",
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "twoFactorSecret" TEXT,
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Client_username_key" ON "Client"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_username_key" ON "Provider"("username");
