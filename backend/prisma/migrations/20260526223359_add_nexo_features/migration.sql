/*
  Warnings:

  - The `status` column on the `Report` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Review` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'resolved', 'rejected');

-- DropIndex
DROP INDEX IF EXISTS "idx_game_title_trgm";

-- DropIndex
DROP INDEX IF EXISTS "idx_user_name_trgm";

-- DropIndex
DROP INDEX IF EXISTS "idx_user_username_trgm";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "status",
ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "status",
ADD COLUMN     "status" "ReviewStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "Game_title_idx" ON "Game"("title");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "Review"("status");

-- RenameIndex
ALTER INDEX "idx_blocked_user_blockedById" RENAME TO "BlockedUser_blockedById_idx";

-- RenameIndex
ALTER INDEX "idx_oaut_account_userId" RENAME TO "OAuthAccount_userId_idx";

-- RenameIndex
ALTER INDEX "idx_password_reset_email" RENAME TO "PasswordReset_email_idx";

-- RenameIndex
ALTER INDEX "idx_report_status" RENAME TO "Report_status_idx";

-- RenameIndex
ALTER INDEX "idx_review_gameId" RENAME TO "Review_gameId_idx";

-- RenameIndex
ALTER INDEX "idx_review_status" RENAME TO "Review_status_idx";

-- RenameIndex
ALTER INDEX "idx_review_userId" RENAME TO "Review_userId_idx";
