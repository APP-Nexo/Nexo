-- CreateTable
CREATE TABLE "AppVersion" (
    "id" SERIAL NOT NULL,
    "appVersion" TEXT NOT NULL,
    "dbVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "activate" BOOLEAN NOT NULL DEFAULT true,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" SERIAL NOT NULL,
    "friendlyId" TEXT NOT NULL,
    "photo" TEXT,
    "banner" TEXT,
    "config" JSONB,
    "bio" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppVersion_appVersion_dbVersion_key" ON "AppVersion"("appVersion", "dbVersion");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_role_key" ON "Role"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_friendlyId_key" ON "UserProfile"("friendlyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE VIEW vw_user_public
WITH (security_barrier = true) AS
SELECT 
    u.id,
    p."friendlyId",
    u.name,
    u.email,
    u."createdAt",
    u."roleId" ,
    p.photo,
    p.banner,
    p.config,
    p."bio"
FROM "User" u
LEFT JOIN "UserProfile" p ON p."userId" = u.id
WHERE u.activate = true;

CREATE OR REPLACE VIEW vw_users_status_summary
WITH (security_barrier = true) AS
SELECT
    COUNT(*)                                           AS "totalUsers",
    COUNT(*) FILTER (WHERE activate = true)            AS "totalActive",
    COUNT(*) FILTER (WHERE activate = false)           AS "totalDeactivated",
    COUNT(*) FILTER (WHERE "roleId" = 2)               AS "totalAdmins",
    COUNT(*) FILTER (WHERE "roleId" = 1)               AS "totalRegularUsers"
FROM "User";