import { AppError } from '../../errors/app-error.js';

export const PRISMA_INT_MAX = 2_147_483_647;

type ThrowError = (message: string, statusCode: number) => never;

export function normalizePrismaId(
    value: number,
    entity: string,
    throwError: ThrowError = AppError.throw,
): number {
    if (!Number.isSafeInteger(value) || value < 1 || value > PRISMA_INT_MAX) {
        throwError(`${entity} inválido.`, 400);
    }
    return value;
}

export function normalizePrismaCursor(
    cursor: string | number | undefined,
    throwError: ThrowError = AppError.throw,
): string | undefined {
    if (cursor === undefined) return undefined;

    const value = Number(cursor);
    if (!Number.isSafeInteger(value) || value < 1 || value > PRISMA_INT_MAX) {
        throwError('Cursor inválido.', 400);
    }
    return String(value);
}
