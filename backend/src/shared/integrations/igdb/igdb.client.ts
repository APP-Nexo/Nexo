import type { IgdbCatalog, IgdbGame } from './igdb.types.js';

const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const IGDB_GAMES_URL = 'https://api.igdb.com/v4/games';
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_RESULTS = 50;
const IMAGE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

const GAME_FIELDS = [
    'id',
    'slug',
    'name',
    'summary',
    'first_release_date',
    'rating',
    'rating_count',
    'cover.image_id',
    'artworks.image_id',
    'genres.name',
    'platforms.name',
    'involved_companies.developer',
    'involved_companies.publisher',
    'involved_companies.company.name',
].join(',');

type JsonObject = Record<string, unknown>;

type CachedToken = {
    value: string;
    refreshAt: number;
};

export type IgdbClientOptions = {
    clientId: string | undefined;
    clientSecret: string | undefined;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
    now?: () => number;
    tokenUrl?: string;
    gamesUrl?: string;
};

export class IgdbIntegrationError extends Error {
    readonly code: string;
    readonly upstreamStatus: number | undefined;

    constructor(message: string, code: string, upstreamStatus?: number) {
        super(message);
        this.name = 'IgdbIntegrationError';
        this.code = code;
        this.upstreamStatus = upstreamStatus;
    }
}

function malformed(field: string): IgdbIntegrationError {
    return new IgdbIntegrationError(`IGDB returned an invalid ${field}.`, 'IGDB_INVALID_RESPONSE');
}

function isObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredObject(value: unknown, field: string): JsonObject {
    if (!isObject(value)) throw malformed(field);
    return value;
}

function requiredString(value: unknown, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) throw malformed(field);
    return value.trim();
}

function optionalString(record: JsonObject, field: string): string | null {
    const value = record[field];
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string') throw malformed(field);
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

function optionalNumber(record: JsonObject, field: string): number | null {
    const value = record[field];
    if (value === undefined || value === null) return null;
    if (typeof value !== 'number' || !Number.isFinite(value)) throw malformed(field);
    return value;
}

function objectArray(record: JsonObject, field: string): JsonObject[] {
    const value = record[field];
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) throw malformed(field);
    return value.map((item, index) => requiredObject(item, `${field}[${index}]`));
}

function namedValues(record: JsonObject, field: string): string[] {
    const values = objectArray(record, field).map((item, index) =>
        requiredString(item.name, `${field}[${index}].name`),
    );
    return [...new Set(values)];
}

function companyName(record: JsonObject, role: 'developer' | 'publisher'): string | null {
    for (const [index, involvement] of objectArray(record, 'involved_companies').entries()) {
        const roleValue = involvement[role];
        if (roleValue !== undefined && typeof roleValue !== 'boolean') {
            throw malformed(`involved_companies[${index}].${role}`);
        }
        if (roleValue !== true) continue;

        const company = requiredObject(involvement.company, `involved_companies[${index}].company`);
        return requiredString(company.name, `involved_companies[${index}].company.name`);
    }
    return null;
}

function imageId(value: unknown, field: string): string {
    const id = requiredString(value, field);
    if (!IMAGE_ID_PATTERN.test(id)) throw malformed(field);
    return id;
}

export function normalizeIgdbImageUrl(id: string, size: 't_cover_big' | 't_1080p'): string {
    if (!IMAGE_ID_PATTERN.test(id)) throw malformed('image_id');
    return `https://images.igdb.com/igdb/image/upload/${size}/${id}.jpg`;
}

function coverUrl(record: JsonObject): string | null {
    const value = record.cover;
    if (value === undefined || value === null) return null;
    const cover = requiredObject(value, 'cover');
    return normalizeIgdbImageUrl(imageId(cover.image_id, 'cover.image_id'), 't_cover_big');
}

function artworkUrl(record: JsonObject): string | null {
    const artwork = objectArray(record, 'artworks')[0];
    if (!artwork) return null;
    return normalizeIgdbImageUrl(imageId(artwork.image_id, 'artworks[0].image_id'), 't_1080p');
}

function releaseDate(record: JsonObject): Date | null {
    const timestamp = optionalNumber(record, 'first_release_date');
    if (timestamp === null) return null;
    if (!Number.isInteger(timestamp)) throw malformed('first_release_date');
    const date = new Date(timestamp * 1_000);
    if (Number.isNaN(date.getTime())) throw malformed('first_release_date');
    return date;
}

function ratingCount(record: JsonObject): number {
    const count = optionalNumber(record, 'rating_count') ?? 0;
    if (!Number.isSafeInteger(count) || count < 0) throw malformed('rating_count');
    return count;
}

function rating(record: JsonObject): number | null {
    const value = optionalNumber(record, 'rating');
    if (value !== null && (value < 0 || value > 100)) throw malformed('rating');
    return value;
}

function popularity(record: JsonObject): number {
    // IGDB removed its former popularity field; rating count is the current engagement proxy.
    return ratingCount(record);
}

function normalizeGame(value: unknown, index: number): IgdbGame {
    const record = requiredObject(value, `games[${index}]`);
    const rawId = record.id;
    if (typeof rawId !== 'number' || !Number.isSafeInteger(rawId) || rawId <= 0) {
        throw malformed(`games[${index}].id`);
    }

    const title = requiredString(record.name, `games[${index}].name`);
    const slug = optionalString(record, 'slug') ?? `igdb-${rawId}`;

    return {
        source: 'igdb',
        externalId: String(rawId),
        slug,
        title,
        cover: coverUrl(record),
        artwork: artworkUrl(record),
        description: optionalString(record, 'summary'),
        releaseDate: releaseDate(record),
        genres: namedValues(record, 'genres'),
        platforms: namedValues(record, 'platforms'),
        developer: companyName(record, 'developer'),
        publisher: companyName(record, 'publisher'),
        popularity: popularity(record),
        igdbRating: rating(record),
        igdbRatingCount: ratingCount(record),
    };
}

function normalizeLimit(limit: number): number {
    if (!Number.isSafeInteger(limit) || limit <= 0) throw new RangeError('limit must be positive.');
    return Math.min(limit, MAX_RESULTS);
}

async function parseJson(response: Response, context: string): Promise<unknown> {
    let text: string;
    try {
        text = await response.text();
    } catch {
        throw new IgdbIntegrationError(
            `Unable to read the ${context} response.`,
            'IGDB_INVALID_RESPONSE',
        );
    }

    if (text.length === 0) throw malformed(`${context} response body`);
    try {
        return JSON.parse(text) as unknown;
    } catch {
        throw malformed(`${context} JSON`);
    }
}

export class IgdbClient implements IgdbCatalog {
    private readonly clientId: string | undefined;
    private readonly clientSecret: string | undefined;
    private readonly timeoutMs: number;
    private readonly fetchImpl: typeof fetch;
    private readonly now: () => number;
    private readonly tokenUrl: string;
    private readonly gamesUrl: string;
    private token: CachedToken | null = null;
    private tokenRequest: Promise<CachedToken> | null = null;

    constructor(options: IgdbClientOptions) {
        this.clientId = options.clientId?.trim() || undefined;
        this.clientSecret = options.clientSecret?.trim() || undefined;
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
        this.now = options.now ?? Date.now;
        this.tokenUrl = options.tokenUrl ?? TWITCH_TOKEN_URL;
        this.gamesUrl = options.gamesUrl ?? IGDB_GAMES_URL;

        if (!Number.isSafeInteger(this.timeoutMs) || this.timeoutMs <= 0) {
            throw new RangeError('timeoutMs must be a positive integer.');
        }
    }

    isConfigured(): boolean {
        return Boolean(this.clientId && this.clientSecret);
    }

    async searchGames(query: string, limit = 20): Promise<IgdbGame[]> {
        const normalizedQuery = query.trim();
        if (normalizedQuery.length === 0 || normalizedQuery.length > 100) {
            throw new RangeError('query must contain between 1 and 100 characters.');
        }

        const body = [
            `fields ${GAME_FIELDS}`,
            `search ${JSON.stringify(normalizedQuery)}`,
            'where version_parent = null',
            `limit ${normalizeLimit(limit)}`,
        ].join('; ');
        return this.requestGames(`${body};`);
    }

    async getTrendingGames(limit = 20): Promise<IgdbGame[]> {
        const body = [
            `fields ${GAME_FIELDS}`,
            'where version_parent = null & cover != null',
            'sort rating_count desc',
            `limit ${normalizeLimit(limit)}`,
        ].join('; ');
        return this.requestGames(`${body};`);
    }

    private async requestGames(body: string): Promise<IgdbGame[]> {
        this.assertConfigured();
        let token = await this.getAccessToken();
        let response = await this.fetchGames(body, token);

        if (response.status === 401) {
            if (this.token?.value === token) this.token = null;
            token = await this.getAccessToken();
            response = await this.fetchGames(body, token);
        }

        if (!response.ok) {
            throw new IgdbIntegrationError(
                `IGDB request failed with status ${response.status}.`,
                'IGDB_UPSTREAM_ERROR',
                response.status,
            );
        }

        const payload = await parseJson(response, 'games');
        if (!Array.isArray(payload)) throw malformed('games response');
        return payload.map(normalizeGame);
    }

    private async fetchGames(body: string, token: string): Promise<Response> {
        try {
            return await this.fetchImpl(this.gamesUrl, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                    'Client-ID': this.clientId!,
                    'Content-Type': 'text/plain',
                },
                body,
                signal: AbortSignal.timeout(this.timeoutMs),
            });
        } catch {
            throw new IgdbIntegrationError('IGDB request failed.', 'IGDB_NETWORK_ERROR');
        }
    }

    private async getAccessToken(): Promise<string> {
        if (this.token && this.now() < this.token.refreshAt) return this.token.value;
        if (this.tokenRequest) return (await this.tokenRequest).value;

        const request = this.requestAccessToken();
        this.tokenRequest = request;
        try {
            this.token = await request;
            return this.token.value;
        } finally {
            if (this.tokenRequest === request) this.tokenRequest = null;
        }
    }

    private async requestAccessToken(): Promise<CachedToken> {
        this.assertConfigured();
        const url = new URL(this.tokenUrl);
        url.searchParams.set('client_id', this.clientId!);
        url.searchParams.set('client_secret', this.clientSecret!);
        url.searchParams.set('grant_type', 'client_credentials');

        let response: Response;
        try {
            response = await this.fetchImpl(url, {
                method: 'POST',
                signal: AbortSignal.timeout(this.timeoutMs),
            });
        } catch {
            throw new IgdbIntegrationError(
                'Twitch authentication request failed.',
                'IGDB_AUTH_NETWORK_ERROR',
            );
        }

        if (!response.ok) {
            throw new IgdbIntegrationError(
                `Twitch authentication failed with status ${response.status}.`,
                'IGDB_AUTH_ERROR',
                response.status,
            );
        }

        const payload = requiredObject(await parseJson(response, 'authentication'), 'token');
        const value = requiredString(payload.access_token, 'access_token');
        const expiresIn = payload.expires_in;
        if (typeof expiresIn !== 'number' || !Number.isSafeInteger(expiresIn) || expiresIn <= 0) {
            throw malformed('expires_in');
        }
        if (payload.token_type !== undefined && typeof payload.token_type !== 'string') {
            throw malformed('token_type');
        }

        const lifetimeMs = expiresIn * 1_000;
        const refreshSkewMs = Math.min(60_000, Math.max(1_000, lifetimeMs * 0.1));
        return {
            value,
            refreshAt: this.now() + Math.max(0, lifetimeMs - refreshSkewMs),
        };
    }

    private assertConfigured(): void {
        if (!this.isConfigured()) {
            throw new IgdbIntegrationError(
                'IGDB credentials are not configured.',
                'IGDB_NOT_CONFIGURED',
            );
        }
    }
}
