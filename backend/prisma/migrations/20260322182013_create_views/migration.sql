-- This is an empty migration.

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
    COUNT(*) FILTER (WHERE activate = true)  AS total_ativos,
    COUNT(*) FILTER (WHERE activate = false) AS total_inativos,
    COUNT(*)                                  AS total_geral
FROM "User";