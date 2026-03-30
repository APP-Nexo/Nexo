-- 4. Criar a Função do Trigger
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Incrementa de quem foi seguido e de quem seguiu
        UPDATE "UserProfile" SET "followersCount" = "followersCount" + 1 WHERE "userId" = NEW."followingId";
        UPDATE "UserProfile" SET "followingCount" = "followingCount" + 1 WHERE "userId" = NEW."followerId";
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrementa de quem foi desseguido e de quem desseguiu
        UPDATE "UserProfile" SET "followersCount" = "followersCount" - 1 WHERE "userId" = OLD."followingId";
        UPDATE "UserProfile" SET "followingCount" = "followingCount" - 1 WHERE "userId" = OLD."followerId";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Garantir que o Trigger não existe antes de criá-lo (Evita erros)
DROP TRIGGER IF EXISTS follow_count_trigger ON "UserFollow";

-- 6. Recriar o Trigger
CREATE TRIGGER follow_count_trigger
AFTER INSERT OR DELETE ON "UserFollow"
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();