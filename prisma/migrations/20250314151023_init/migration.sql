/*
  Warnings:

  - A unique constraint covering the columns `[subjectId,semesterId,teacherId]` on the table `SubjectOffering` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SubjectOffering_subjectId_semesterId_teacherId_key" ON "SubjectOffering"("subjectId", "semesterId", "teacherId");
