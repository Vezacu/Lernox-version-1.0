/*
  Warnings:

  - A unique constraint covering the columns `[studentId,subjectOfferingId]` on the table `Enrollment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_subjectOfferingId_key" ON "Enrollment"("studentId", "subjectOfferingId");
