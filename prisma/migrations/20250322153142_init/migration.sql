/*
  Warnings:

  - You are about to drop the column `courseId` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the column `enrollmentDate` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the column `semesterId` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the `EnrollmentSubjectOffering` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `subjectOfferingId` to the `Enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "EnrollmentSubjectOffering" DROP CONSTRAINT "EnrollmentSubjectOffering_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "EnrollmentSubjectOffering" DROP CONSTRAINT "EnrollmentSubjectOffering_subjectOfferingId_fkey";

-- DropIndex
DROP INDEX "Enrollment_studentId_courseId_semesterId_key";

-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "courseId",
DROP COLUMN "createdAt",
DROP COLUMN "enrollmentDate",
DROP COLUMN "semesterId",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "subjectOfferingId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "EnrollmentSubjectOffering";

-- DropEnum
DROP TYPE "EnrollmentStatus";

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES "SubjectOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
