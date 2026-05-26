export type DashboardMetricsDTO = {
    totalUsers: number;
    totalReviews: number;
    totalGames: number;
    activeToday: number;
    pendingReviews: number;
    pendingReports: number;
    topGames: { id: number; title: string; cover: string | null; reviewCount: number }[];
    recentActivity: {
        date: string;
        newUsers: number;
        newReviews: number;
    }[];
};
