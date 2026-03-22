/*
  Warnings:

  - You are about to drop the `c` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "c";

-- CreateTable
CREATE TABLE "AppVersion" (
    "id" SERIAL NOT NULL,
    "appVersion" TEXT NOT NULL,
    "dbVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppVersion_pkey" PRIMARY KEY ("id")
);
