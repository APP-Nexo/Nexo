export function prismaErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;

    const code = error.code;
    return typeof code === 'string' ? code : undefined;
}

export function hasPrismaCode(error: unknown, code: string): boolean {
    return prismaErrorCode(error) === code;
}

export function hasAnyPrismaCode(error: unknown, ...codes: string[]): boolean {
    const code = prismaErrorCode(error);
    return code !== undefined && codes.includes(code);
}
