/*
  Warnings:

  - You are about to drop the column `subjectOfferingId` on the `Enrollment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,lessonId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,courseId,semesterId]` on the table `Enrollment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `courseId` to the `Enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semesterId` to the `Enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'WITHDRAWN', 'FAILED');

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_subjectOfferingId_fkey";

-- DropIndex
DROP INDEX "Attendance_studentId_present_idx";

-- DropIndex
DROP INDEX "Enrollment_studentId_subjectOfferingId_key";

-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "subjectOfferingId",
ADD COLUMN     "courseId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "semesterId" INTEGER NOT NULL,
ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "EnrollmentSubjectOffering" (
    "id" SERIAL NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "subjectOfferingId" INTEGER NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "grade" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentSubjectOffering_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentSubjectOffering_enrollmentId_subjectOfferingId_key" ON "EnrollmentSubjectOffering"("enrollmentId", "subjectOfferingId");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_lessonId_date_key" ON "Attendance"("studentId", "lessonId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_courseId_semesterId_key" ON "Enrollment"("studentId", "courseId", "semesterId");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentSubjectOffering" ADD CONSTRAINT "EnrollmentSubjectOffering_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentSubjectOffering" ADD CONSTRAINT "EnrollmentSubjectOffering_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES "SubjectOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
