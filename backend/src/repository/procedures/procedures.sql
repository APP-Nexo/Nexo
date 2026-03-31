CREATE OR REPLACE FUNCTION follow_user(
    p_follower_id INT,
    p_following_id INT
) RETURNS VOID AS $$
BEGIN
    -- Cria o follow
    INSERT INTO user_follow ("followerId", "followingId")
    VALUES (p_follower_id, p_following_id)
    ON CONFLICT DO NOTHING;

    -- Cria a notificação
    INSERT INTO notification ("userId", "fromId", type)
    VALUES (p_following_id, p_follower_id, 'follow');
END;
$$ LANGUAGE plpgsql;