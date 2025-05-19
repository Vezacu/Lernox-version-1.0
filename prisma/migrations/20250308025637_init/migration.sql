/*
  Warnings:

  - The `status` column on the `AdmissionForm` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `classId` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `Lesson` table. All the data in the column will be lost.
  - The `status` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `classId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `gradeId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `semesterId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the `Class` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Grade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SubjectToTeacher` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `subjectOfferingId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectOfferingId` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectOfferingId` to the `Lesson` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "AdmissionStatus" ADD VALUE 'REJECTED';

-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_classId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_supervisorId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_classId_fkey";

-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_classId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_classId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "_SubjectToTeacher" DROP CONSTRAINT "_SubjectToTeacher_A_fkey";

-- DropForeignKey
ALTER TABLE "_SubjectToTeacher" DROP CONSTRAINT "_SubjectToTeacher_B_fkey";

-- AlterTable
ALTER TABLE "AdmissionForm" DROP COLUMN "status",
ADD COLUMN     "status" "AdmissionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "classId",
ADD COLUMN     "courseId" INTEGER,
ADD COLUMN     "semesterId" INTEGER;

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "lessonId",
ADD COLUMN     "subjectOfferingId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "classId",
ADD COLUMN     "courseId" INTEGER,
ADD COLUMN     "semesterId" INTEGER;

-- AlterTable
ALTER TABLE "Exam" DROP COLUMN "lessonId",
ADD COLUMN     "subjectOfferingId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "classId",
DROP COLUMN "name",
DROP COLUMN "subjectId",
DROP COLUMN "teacherId",
ADD COLUMN     "subjectOfferingId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "classId",
DROP COLUMN "gradeId",
DROP COLUMN "semesterId",
ADD COLUMN     "currentSemesterId" INTEGER;

-- DropTable
DROP TABLE "Class";

-- DropTable
DROP TABLE "Grade";

-- DropTable
DROP TABLE "_SubjectToTeacher";

-- CreateTable
CREATE TABLE "SubjectOffering" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "semesterId" INTEGER NOT NULL,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "SubjectOffering_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_currentSemesterId_fkey" FOREIGN KEY ("currentSemesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectOffering" ADD CONSTRAINT "SubjectOffering_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectOffering" ADD CONSTRAINT "SubjectOffering_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectOffering" ADD CONSTRAINT "SubjectOffering_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES "SubjectOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES "SubjectOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_subjectOfferingId_fkey" FOREIGN KEY ("subjectOfferingId") REFERENCES "SubjectOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;
