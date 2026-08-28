import type { FastifyRequest } from 'fastify';
import { MeAccountService } from './application/account.service.js';
import { MeProfileService } from './application/profile.service.js';
import { MeSecurityService } from './application/security.service.js';
import type { ChangePasswordPayload, UpdateMePayload } from './me.interfaces.js';

// Facade kept at the feature boundary so controllers and existing consumers stay stable.
export class MeService {
    static getMe(userId: number) {
        return MeProfileService.getMe(userId);
    }

    static updateMe(userId: number, payload: UpdateMePayload) {
        return MeProfileService.updateMe(userId, payload);
    }

    static updateMeMultipart(userId: number, req: FastifyRequest) {
        return MeProfileService.updateMeMultipart(userId, req);
    }

    static changePassword(
        userId: number,
        currentPassword: ChangePasswordPayload['currentPassword'],
        newPassword: ChangePasswordPayload['newPassword'],
    ) {
        return MeSecurityService.changePassword(userId, currentPassword, newPassword);
    }

    static deleteMe(userId: number, password: string) {
        return MeAccountService.deleteMe(userId, password);
    }
}
