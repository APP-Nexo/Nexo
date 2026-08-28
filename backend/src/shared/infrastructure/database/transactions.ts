import type { Prisma, PrismaClient } from '../../../generated/client.js';

export type TransactionDatabase = Pick<PrismaClient, '$transaction'>;
export type TransactionOperation<T> = (tx: Prisma.TransactionClient) => Promise<T>;

export async function runSerializableTransaction<T>(
    database: TransactionDatabase,
    operation: TransactionOperation<T>,
): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await database.$transaction(operation, { isolationLevel: 'Serializable' });
        } catch (error) {
            if (!isSerializationConflict(error) || attempt === 2) throw error;
        }
    }

    throw new Error('Transaction retry limit reached.');
}

function isSerializationConflict(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034';
}
