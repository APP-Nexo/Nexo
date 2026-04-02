-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "toUserId" INTEGER NOT NULL,
    "fromUserId" INTEGER NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION follow_user(
    p_follower_id INT,
    p_following_id INT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO user_follow ("followerId", "followingId")
    VALUES (p_follower_id, p_following_id)
    ON CONFLICT DO NOTHING;

    INSERT INTO notification ("toUserId", "fromUserId")
    VALUES (p_following_id, p_follower_id);
END;
$$ LANGUAGE plpgsql;