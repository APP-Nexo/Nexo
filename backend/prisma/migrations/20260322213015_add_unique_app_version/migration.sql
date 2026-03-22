/*
  Warnings:

  - A unique constraint covering the columns `[appVersion,dbVersion]` on the table `AppVersion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AppVersion_appVersion_dbVersion_key" ON "AppVersion"("appVersion", "dbVersion");
