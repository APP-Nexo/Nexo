export class HealthService {
    static health() {
        return { message: 'healthy', uptime: process.uptime() };
    }

    static ping() {
        return { message: 'pong', timestamp: new Date() };
    }
}
