-- 2. Recriar View Pública
CREATE VIEW "vw_user_public"
WITH (security_barrier = true) AS
SELECT 
    u."id",
    p."friendlyId",
    u."name",
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

-- 3. Recriar View de Status Estratégica
CREATE VIEW "vw_users_status_summary"
WITH (security_barrier = true) AS
SELECT
    COUNT(*)                                           AS "totalUsers",
    COUNT(*) FILTER (WHERE "activate" = true)          AS "totalActive",
    COUNT(*) FILTER (WHERE "activate" = false)         AS "totalDeactivated",
    COUNT(*) FILTER (WHERE "roleId" = 2)               AS "totalAdmins",
    COUNT(*) FILTER (WHERE "roleId" = 1)               AS "totalRegularUsers"
FROM "User";