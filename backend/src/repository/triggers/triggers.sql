CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "UserProfile" SET "followersCount" = "followersCount" + 1 WHERE "userId" = NEW."followingId";
        UPDATE "UserProfile" SET "followingCount" = "followingCount" + 1 WHERE "userId" = NEW."followerId";
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE "UserProfile" SET "followersCount" = "followersCount" - 1 WHERE "userId" = OLD."followingId";
        UPDATE "UserProfile" SET "followingCount" = "followingCount" - 1 WHERE "userId" = OLD."followerId";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follow_count_trigger
AFTER INSERT OR DELETE ON "UserFollow"
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();