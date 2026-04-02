-- This is an empty migration.

CREATE OR REPLACE FUNCTION follow_user(
    p_follower_id INT,
    p_following_id INT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO "UserFollow" ("followerId", "followingId")
    VALUES (p_follower_id, p_following_id)
    ON CONFLICT DO NOTHING;

    INSERT INTO "Notification" ("toUserId", "fromUserId")
    VALUES (p_following_id, p_follower_id);
END;
$$ LANGUAGE plpgsql;