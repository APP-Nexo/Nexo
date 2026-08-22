CREATE TYPE "NotificationType" AS ENUM ('follow', 'review', 'report', 'moderation', 'system');
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "UserGameStatus" AS ENUM ('want_to_play', 'playing', 'completed', 'tried', 'abandoned');
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'resolved', 'rejected');

CREATE TABLE "AppVersion" (
    "id" SERIAL NOT NULL,
    "appVersion" TEXT NOT NULL,
    "dbVersion" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "activate" BOOLEAN NOT NULL DEFAULT true,
    "roleId" INTEGER NOT NULL,
    "credentialVersion" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "User_credentialVersion_check" CHECK ("credentialVersion" >= 0)
);

CREATE TABLE "UserProfile" (
    "id" SERIAL NOT NULL,
    "friendlyId" TEXT NOT NULL,
    "photo" TEXT,
    "banner" TEXT,
    "config" JSONB,
    "bio" TEXT,
    "userId" INTEGER NOT NULL,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserProfile_followersCount_check" CHECK ("followersCount" >= 0),
    CONSTRAINT "UserProfile_followingCount_check" CHECK ("followingCount" >= 0)
);

CREATE TABLE "UserFollow" (
    "id" SERIAL NOT NULL,
    "followerId" INTEGER NOT NULL,
    "followingId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserFollow_not_self_check" CHECK ("followerId" <> "followingId")
);

CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "type" "NotificationType" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "entityType" TEXT,
    "entityId" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "toUserId" INTEGER NOT NULL,
    "fromUserId" INTEGER,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "previousTokenHash" TEXT,
    "previousTokenExpiresAt" TIMESTAMP(3),
    "familyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "credentialVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuthSession_credentialVersion_check" CHECK ("credentialVersion" >= 0)
);

CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'igdb',
    "externalId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cover" TEXT,
    "artwork" TEXT,
    "description" TEXT,
    "releaseDate" TIMESTAMP(3),
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "developer" TEXT,
    "publisher" TEXT,
    "popularity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trendingRank" INTEGER,
    "trendingAt" TIMESTAMP(3),
    "igdbRating" DOUBLE PRECISION,
    "igdbRatingCount" INTEGER NOT NULL DEFAULT 0,
    "ratingSum" INTEGER NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Game_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Game_ratingSum_check" CHECK ("ratingSum" >= 0),
    CONSTRAINT "Game_ratingCount_check" CHECK ("ratingCount" >= 0),
    CONSTRAINT "Game_averageRating_check" CHECK ("averageRating" >= 0 AND "averageRating" <= 5)
);

CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'approved',
    "moderationReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Review_rating_check" CHECK ("rating" BETWEEN 1 AND 5),
    CONSTRAINT "Review_version_check" CHECK ("version" >= 1)
);

CREATE TABLE "UserGame" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "status" "UserGameStatus" NOT NULL DEFAULT 'want_to_play',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserGame_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserGame_progress_check" CHECK ("progress" IS NULL OR "progress" BETWEEN 0 AND 100)
);

CREATE TABLE "UserGameList" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserGameList_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserGameListItem" (
    "id" SERIAL NOT NULL,
    "listId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserGameListItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlockedUser" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "blockedById" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlockedUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reviewRating" INTEGER NOT NULL,
    "reviewText" TEXT,
    "reviewCreatedAt" TIMESTAMP(3) NOT NULL,
    "reviewVersion" INTEGER NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "resolvedById" INTEGER,
    "resolutionReason" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Report_reviewRating_check" CHECK ("reviewRating" BETWEEN 1 AND 5),
    CONSTRAINT "Report_reviewVersion_check" CHECK ("reviewVersion" >= 1)
);

CREATE TABLE "AdminAuditLog" (
    "id" SERIAL NOT NULL,
    "actorId" INTEGER NOT NULL,
    "targetUserId" INTEGER,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppVersion_appVersion_dbVersion_key" ON "AppVersion"("appVersion", "dbVersion");
CREATE UNIQUE INDEX "Role_role_key" ON "Role"("role");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_ci_key" ON "User"(LOWER("username"));
CREATE UNIQUE INDEX "User_email_ci_key" ON "User"(LOWER("email"));
CREATE INDEX "User_activate_createdAt_idx" ON "User"("activate", "createdAt");
CREATE UNIQUE INDEX "UserProfile_friendlyId_key" ON "UserProfile"("friendlyId");
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");
CREATE INDEX "UserFollow_followingId_timestamp_id_idx" ON "UserFollow"("followingId", "timestamp", "id");
CREATE INDEX "UserFollow_followerId_timestamp_id_idx" ON "UserFollow"("followerId", "timestamp", "id");
CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");
CREATE INDEX "Notification_toUserId_createdAt_id_idx" ON "Notification"("toUserId", "createdAt", "id");
CREATE INDEX "Notification_toUserId_read_idx" ON "Notification"("toUserId", "read");
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");
CREATE INDEX "AuthSession_userId_revokedAt_idx" ON "AuthSession"("userId", "revokedAt");
CREATE INDEX "AuthSession_familyId_idx" ON "AuthSession"("familyId");
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");
CREATE INDEX "Game_title_idx" ON "Game"("title");
CREATE INDEX "Game_popularity_id_idx" ON "Game"("popularity", "id");
CREATE INDEX "Game_trendingRank_id_idx" ON "Game"("trendingRank", "id");
CREATE INDEX "Game_releaseDate_id_idx" ON "Game"("releaseDate", "id");
CREATE UNIQUE INDEX "Game_source_externalId_key" ON "Game"("source", "externalId");
CREATE INDEX "Review_userId_status_createdAt_id_idx" ON "Review"("userId", "status", "createdAt", "id");
CREATE INDEX "Review_gameId_status_createdAt_id_idx" ON "Review"("gameId", "status", "createdAt", "id");
CREATE INDEX "Review_status_createdAt_id_idx" ON "Review"("status", "createdAt", "id");
CREATE UNIQUE INDEX "Review_userId_gameId_key" ON "Review"("userId", "gameId");
CREATE INDEX "UserGame_userId_isFavorite_updatedAt_id_idx" ON "UserGame"("userId", "isFavorite", "updatedAt", "id");
CREATE INDEX "UserGame_userId_status_updatedAt_id_idx" ON "UserGame"("userId", "status", "updatedAt", "id");
CREATE UNIQUE INDEX "UserGame_userId_gameId_key" ON "UserGame"("userId", "gameId");
CREATE INDEX "UserGameList_userId_updatedAt_id_idx" ON "UserGameList"("userId", "updatedAt", "id");
CREATE UNIQUE INDEX "UserGameList_userId_name_key" ON "UserGameList"("userId", "name");
CREATE INDEX "UserGameListItem_gameId_idx" ON "UserGameListItem"("gameId");
CREATE UNIQUE INDEX "UserGameListItem_listId_gameId_key" ON "UserGameListItem"("listId", "gameId");
CREATE UNIQUE INDEX "PasswordReset_tokenHash_key" ON "PasswordReset"("tokenHash");
CREATE UNIQUE INDEX "PasswordReset_userId_key" ON "PasswordReset"("userId");
CREATE INDEX "PasswordReset_userId_expiresAt_idx" ON "PasswordReset"("userId", "expiresAt");
CREATE UNIQUE INDEX "BlockedUser_userId_key" ON "BlockedUser"("userId");
CREATE INDEX "BlockedUser_blockedById_idx" ON "BlockedUser"("blockedById");
CREATE INDEX "Report_status_createdAt_id_idx" ON "Report"("status", "createdAt", "id");
CREATE INDEX "Report_reviewId_idx" ON "Report"("reviewId");
CREATE UNIQUE INDEX "Report_reporterId_reviewId_reviewVersion_key" ON "Report"("reporterId", "reviewId", "reviewVersion");
CREATE INDEX "AdminAuditLog_actorId_createdAt_id_idx" ON "AdminAuditLog"("actorId", "createdAt", "id");
CREATE INDEX "AdminAuditLog_targetUserId_createdAt_id_idx" ON "AdminAuditLog"("targetUserId", "createdAt", "id");
CREATE INDEX "AdminAuditLog_entityType_entityId_idx" ON "AdminAuditLog"("entityType", "entityId");

ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserGame" ADD CONSTRAINT "UserGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserGame" ADD CONSTRAINT "UserGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserGameList" ADD CONSTRAINT "UserGameList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserGameListItem" ADD CONSTRAINT "UserGameListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "UserGameList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserGameListItem" ADD CONSTRAINT "UserGameListItem_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockedById_fkey" FOREIGN KEY ("blockedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
