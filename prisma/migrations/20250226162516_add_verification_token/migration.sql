/*
  Warnings:

  - You are about to drop the column `parentVerified` on the `AdmissionForm` table. All the data in the column will be lost.
  - You are about to drop the column `paymentId` on the `AdmissionForm` table. All the data in the column will be lost.
  - The `status` column on the `AdmissionForm` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `AdmissionForm` table without a default value. This is not possible if the table is not empty.
  - Made the column `parentEmail` on table `AdmissionForm` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Made the column `admissionId` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_admissionId_fkey";

-- DropIndex
DROP INDEX "AdmissionForm_email_key";

-- DropIndex
DROP INDEX "AdmissionForm_phone_key";

-- DropIndex
DROP INDEX "Payment_admissionId_key";

-- AlterTable
ALTER TABLE "AdmissionForm" DROP COLUMN "parentVerified",
DROP COLUMN "paymentId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "parentEmail" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "admissionId" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "admissionId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "AdmissionForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "AdmissionForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
