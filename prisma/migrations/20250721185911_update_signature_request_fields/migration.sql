-- AlterTable
DROP COLUMN "signedPsbt",
DROP COLUMN "unsignedPsbt",
ADD COLUMN     "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentHash" TEXT,
ADD COLUMN     "psbtData" TEXT NOT NULL,
ADD COLUMN     "psbtHash" TEXT,
ADD COLUMN     "signatureFee" BIGINT NOT NULL,
ADD COLUMN     "signedPsbtData" TEXT;
