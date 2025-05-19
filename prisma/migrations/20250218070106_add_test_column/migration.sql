/*
  Warnings:

  - You are about to drop the column `img` on the `Parent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Parent" DROP COLUMN "img",
ADD COLUMN     "test" TEXT DEFAULT 'default_value';
