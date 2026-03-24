-- Gerencial
CREATE OR REPLACE VIEW vw_user_public
WITH (security_barrier = true) AS
SELECT 
    u.id,
    u.name,
    u.email,
    u."createdAt",
    p.photo,
    p.banner,
    p.bio,
    p.config
FROM "User" u
LEFT JOIN "UserProfile" p ON p."userId" = u.id
WHERE u.activate = true;
-- DROP VIEW IF EXISTS vw_user_public;

-- Estratégica
CREATE OR REPLACE VIEW vw_users_status_summary
WITH (security_barrier = true) AS
SELECT
    COUNT(*) FILTER (WHERE activate = true)  AS "totalActive",
    COUNT(*) FILTER (WHERE activate = false) AS "totalDeactivated",
    COUNT(*)                                  AS "totalUsers"
FROM "User";
-- DROP VIEW IF EXISTS vw_users_status_summary;