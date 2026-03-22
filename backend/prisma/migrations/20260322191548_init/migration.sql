-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activate" BOOLEAN NOT NULL DEFAULT true,
    "access" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" SERIAL NOT NULL,
    "photo" TEXT,
    "banner" TEXT,
    "config" JSONB,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- views
CREATE OR REPLACE VIEW vw_user_public
WITH (security_barrier = true) AS
SELECT 
    u.id,
    u.name,
    u.email,
    u."createdAt",
    p.photo,
    p.banner,
    p.config
FROM "User" u
LEFT JOIN "UserProfile" p ON p."userId" = u.id
WHERE u.activate = true;

CREATE OR REPLACE VIEW vw_users_status_summary
WITH (security_barrier = true) AS
SELECT
    COUNT(*) FILTER (WHERE activate = true)  AS "totalActive",
    COUNT(*) FILTER (WHERE activate = false) AS "totalDeactivated",
    COUNT(*)                                  AS "totalUsers"
FROM "User";