/*
  Warnings:

  - You are about to drop the column `endTime` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `assignmentId` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `examId` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `Result` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectOfferingId` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `Semester` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Semester` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('HOLIDAY', 'EXAM', 'COLLEGE_EVENT');

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_examId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "affectsAttendance" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "endDate" DATE NOT NULL,
ADD COLUMN     "startDate" DATE NOT NULL,
ADD COLUMN     "type" "EventType" NOT NULL;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledById" TEXT,
ADD COLUMN     "isMakeupClass" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "status" "LessonStatus" NOT NULL DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "Result" DROP COLUMN "assignmentId",
DROP COLUMN "examId",
DROP COLUMN "score",
ADD COLUMN     "attendanceScore" INTEGER,
ADD COLUMN     "internalMarks" INTEGER,
ADD COLUMN     "subjectOfferingId" INTEGER NOT NULL,
ADD COLUMN     "theoryMarks" INTEGER;

-- AlterTable
ALTER TABLE "Semester" ADD COLUMN     "endDate" DATE NOT NULL,
ADD COLUMN     "startDate" DATE NOT NULL;

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectOfferingId" INTEGER NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_subjectOfferingId_key" ON "Enrollment"("studentId", "subjectOfferingId");

-- CreateIndex
CREATE INDEX "Attendance_studentId_present_idx" ON "Attendance"("studentId", "present");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES "SubjectOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
