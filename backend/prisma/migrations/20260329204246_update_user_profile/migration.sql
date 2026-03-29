/*
  Warnings:

  - You are about to drop the column `createdAt` on the `UserFollow` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserFollow" DROP COLUMN "createdAt",
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
