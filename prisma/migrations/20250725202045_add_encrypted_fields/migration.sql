-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "encryptedXpubData" JSONB;

-- AlterTable
ALTER TABLE "ServicePurchase" ADD COLUMN     "encryptedPaymentHashData" JSONB;

-- CreateTable
CREATE TABLE "SignatureRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "psbtData" TEXT NOT NULL,
    "encryptedPsbtData" JSONB,
    "signedPsbtData" TEXT,
    "encryptedSignedPsbtData" JSONB,
    "psbtHash" TEXT,
    "paymentHash" TEXT,
    "encryptedPaymentHashData" JSONB,
    "verifyUrl" TEXT,
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "signatureFee" BIGINT NOT NULL,
    "unlocksAt" TIMESTAMP(3) NOT NULL,
    "signedAt" TIMESTAMP(3),
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "SignatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SignatureRequest_paymentHash_key" ON "SignatureRequest"("paymentHash");

-- AddForeignKey
ALTER TABLE "SignatureRequest" ADD CONSTRAINT "SignatureRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRequest" ADD CONSTRAINT "SignatureRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
