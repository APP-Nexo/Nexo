import { randomUUID } from 'node:crypto';
import type { Prisma } from '../../../generated/client.js';
import { recalculateRatingsForUser } from '../../games/application/rating-aggregate.service.js';
import { detachUserSocialGraph } from '../../social/application/social-graph.service.js';

export type AccountLifecycleAction = 'deleted' | 'banned';

export type AccountLifecycleResult = {
    deactivatedAt: Date;
    revokedSessions: number;
    uploads: readonly [
        { directory: 'avatars'; url: string | null | undefined },
        { directory: 'banners'; url: string | null | undefined },
    ];
};

type AccountLifecycleTarget = {
    id: number;
    profile?: { photo: string | null; banner: string | null } | null;
};

export async function deactivateAccount(
    tx: Prisma.TransactionClient,
    target: AccountLifecycleTarget,
    action: AccountLifecycleAction,
    deactivatedAt = new Date(),
): Promise<AccountLifecycleResult> {
    const anonymousId = randomUUID();
    const prefix = action === 'banned' ? 'banned' : 'deleted';

    await tx.user.update({
        where: { id: target.id },
        data: {
            activate: false,
            deletedAt: deactivatedAt,
            credentialVersion: { increment: 1 },
            username: `${prefix}_${target.id}_${anonymousId}`,
            email: `${prefix}-${target.id}-${anonymousId}@deleted.invalid`,
        },
    });
    await tx.userProfile.updateMany({
        where: { userId: target.id },
        data: { photo: null, banner: null, bio: null },
    });
    await recalculateRatingsForUser(tx, target.id);
    await detachUserSocialGraph(tx, target.id);

    const revokedSessions = await tx.authSession.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { revokedAt: deactivatedAt },
    });

    return {
        deactivatedAt,
        revokedSessions: revokedSessions.count,
        uploads: [
            { directory: 'avatars', url: target.profile?.photo },
            { directory: 'banners', url: target.profile?.banner },
        ],
    };
}
