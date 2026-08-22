import { env } from '../../config/env.js';
import { IgdbClient } from './igdb.client.js';

export { IgdbClient, IgdbIntegrationError, normalizeIgdbImageUrl } from './igdb.client.js';
export type { IgdbCatalog, IgdbGame, IgdbSyncOptions } from './igdb.types.js';

export const igdbClient = new IgdbClient({
    clientId: env.igdbClientId,
    clientSecret: env.igdbClientSecret,
});
