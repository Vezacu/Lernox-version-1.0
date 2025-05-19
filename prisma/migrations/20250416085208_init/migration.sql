/*
  Warnings:

  - You are about to drop the column `subjectOfferingId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `attendanceScore` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `internalMarks` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `subjectOfferingId` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `theoryMarks` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentId,subjectId]` on the table `Result` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `description` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `attendance` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `external` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `internal` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectId` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Result` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_subjectOfferingId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_semesterId_fkey";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "subjectOfferingId",
ADD COLUMN     "attachment" TEXT,
ADD COLUMN     "courseId" INTEGER,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "semesterId" INTEGER;

-- AlterTable
ALTER TABLE "Result" DROP COLUMN "attendanceScore",
DROP COLUMN "internalMarks",
DROP COLUMN "subjectOfferingId",
DROP COLUMN "theoryMarks",
ADD COLUMN     "attendance" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "external" INTEGER NOT NULL,
ADD COLUMN     "internal" INTEGER NOT NULL,
ADD COLUMN     "subjectId" INTEGER NOT NULL,
ADD COLUMN     "total" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Event";

-- CreateIndex
CREATE UNIQUE INDEX "Result_studentId_subjectId_key" ON "Result"("studentId", "subjectId");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
