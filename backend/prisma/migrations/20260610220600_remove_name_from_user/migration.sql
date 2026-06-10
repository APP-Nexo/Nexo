-- Drop the name column from User
ALTER TABLE "User" DROP COLUMN "name";

-- Drop and recreate the public view without name
DROP VIEW IF EXISTS "vw_user_public";
CREATE VIEW "vw_user_public"
WITH (security_barrier = true) AS
SELECT 
    u."id",
    p."friendlyId",
    u."email",
    u."createdAt",
    u."roleId",
    p."photo",
    p."banner",
    p."bio",
    p."config",
    p."followersCount",
    p."followingCount"
FROM "User" u
LEFT JOIN "UserProfile" p ON p."userId" = u."id"
WHERE u."activate" = true;
