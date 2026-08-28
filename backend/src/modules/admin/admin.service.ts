import type { ReportResolutionPayload, ReviewModerationPayload } from './admin.interfaces.js';
import { AdminDashboardService } from './application/dashboard.service.js';
import { AdminModerationService } from './application/moderation.service.js';
import { AdminUserManagementService } from './application/user-management.service.js';

// Feature facade that keeps the HTTP boundary stable while use cases stay separated.
export class AdminService {
    static getDashboard() {
        return AdminDashboardService.getDashboard();
    }

    static getUsersStats() {
        return AdminDashboardService.getUsersStats();
    }

    static getUsersAdmin(cursor?: string, limit = 10) {
        return AdminUserManagementService.getUsersAdmin(cursor, limit);
    }

    static searchUser(query: string, cursor?: string) {
        return AdminUserManagementService.searchUser(query, cursor);
    }

    static getUsers(cursor?: string, limit = 10) {
        return AdminUserManagementService.getUsers(cursor, limit);
    }

    static getUserDetail(id: number) {
        return AdminUserManagementService.getUserDetail(id);
    }

    static blockUser(userId: number, actorId: number, rawReason?: string) {
        return AdminUserManagementService.blockUser(userId, actorId, rawReason);
    }

    static unblockUser(userId: number, actorId: number) {
        return AdminUserManagementService.unblockUser(userId, actorId);
    }

    static deleteUser(userId: number, actorId: number) {
        return AdminUserManagementService.deleteUser(userId, actorId);
    }

    static getReviews(
        status: 'pending' | 'approved' | 'rejected' = 'pending',
        cursor?: string,
        limit = 10,
    ) {
        return AdminModerationService.getReviews(status, cursor, limit);
    }

    static moderateReview(reviewId: number, actorId: number, payload: ReviewModerationPayload) {
        return AdminModerationService.moderateReview(reviewId, actorId, payload);
    }

    static deleteReview(reviewId: number, actorId: number) {
        return AdminModerationService.deleteReview(reviewId, actorId);
    }

    static getReports(
        status: 'pending' | 'resolved' | 'rejected' = 'pending',
        cursor?: string,
        limit = 50,
    ) {
        return AdminModerationService.getReports(status, cursor, limit);
    }

    static updateReport(reportId: number, actorId: number, payload: ReportResolutionPayload) {
        return AdminModerationService.updateReport(reportId, actorId, payload);
    }
}
