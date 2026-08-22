export type SearchByEmailPayload = {
    q: string;
    cursor?: string | number;
};

export type PaginationPayload = {
    cursor?: string | number;
    limit?: number;
};

export type ReviewsQuery = PaginationPayload & {
    status?: 'pending' | 'approved' | 'rejected';
};

export type ReportsQuery = PaginationPayload & {
    status?: 'pending' | 'resolved' | 'rejected';
};

export type ReviewModerationPayload = {
    action: 'approve' | 'reject';
    reason?: string;
};

export type ReportResolutionPayload = {
    status: 'resolved' | 'rejected';
    action?: 'reject_review';
    reason?: string;
};
