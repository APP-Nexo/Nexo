-- Trigger: atualiza contadores de seguidores no UserProfile
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Incrementa followers de quem foi seguido
        UPDATE "UserProfile" SET "followersCount" = "followersCount" + 1 WHERE "userId" = NEW."followingId";
        -- Incrementa following de quem seguiu
        UPDATE "UserProfile" SET "followingCount" = "followingCount" + 1 WHERE "userId" = NEW."followerId";
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrementa followers de quem foi desseguido
        UPDATE "UserProfile" SET "followersCount" = "followersCount" - 1 WHERE "userId" = OLD."followingId";
        -- Decrementa following de quem desseguiu
        UPDATE "UserProfile" SET "followingCount" = "followingCount" - 1 WHERE "userId" = OLD."followerId";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dispara após INSERT ou DELETE na tabela UserFollow
CREATE TRIGGER follow_count_trigger
AFTER INSERT OR DELETE ON "UserFollow"
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();