import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { FastifyRequest } from 'fastify';
import { AppError } from '../../../shared/errors/app-error.js';
import {
    localUploadPath,
    removeLocalUploadPaths,
} from '../../../shared/infrastructure/storage/local-upload.storage.js';
import { BIO_MAX_LENGTH, type UpdateMePayload } from '../me.interfaces.js';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const MULTIPART_FIELDS = new Set(['photo', 'banner', 'username', 'bio']);
const FILE_FIELDS = new Set(['photo', 'banner']);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP_RIFF_SIGNATURE = Buffer.from('RIFF');
const WEBP_SIGNATURE = Buffer.from('WEBP');

export type ImageField = 'photo' | 'banner';

type ImageType = {
    extension: '.jpg' | '.png' | '.webp';
    mime: 'image/jpeg' | 'image/png' | 'image/webp';
};

export type StagedUpload = {
    field: ImageField;
    directory: 'avatars' | 'banners';
    temporaryPath: string;
    finalPath: string;
    url: string;
};

function detectImageType(buffer: Buffer): ImageType | null {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { extension: '.jpg', mime: 'image/jpeg' };
    }
    if (buffer.length >= PNG_SIGNATURE.length && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
        return { extension: '.png', mime: 'image/png' };
    }
    if (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).equals(WEBP_RIFF_SIGNATURE) &&
        buffer.subarray(8, 12).equals(WEBP_SIGNATURE)
    ) {
        return { extension: '.webp', mime: 'image/webp' };
    }
    return null;
}

function invalidMultipartField(): never {
    AppError.throw('Use apenas os campos photo, banner, username e bio.', 400);
}

function throwMultipartError(error: unknown): never {
    if (error instanceof AppError) throw error;
    if (
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        error.statusCode === 413
    ) {
        throw error;
    }
    AppError.throw('Conteúdo multipart inválido.', 400);
}

async function* multipartParts(req: FastifyRequest) {
    try {
        yield* req.parts({
            limits: {
                fileSize: MAX_UPLOAD_SIZE,
                files: 2,
                fields: 2,
                parts: 4,
                fieldSize: BIO_MAX_LENGTH * 4,
            },
        });
    } catch (error) {
        throwMultipartError(error);
    }
}

export async function parseProfileMultipart(req: FastifyRequest, userId: number) {
    const payload: UpdateMePayload = {};
    const uploads: StagedUpload[] = [];
    const temporaryPaths: string[] = [];
    const seenFields = new Set<string>();

    try {
        for await (const part of multipartParts(req)) {
            if (!MULTIPART_FIELDS.has(part.fieldname) || seenFields.has(part.fieldname)) {
                if (part.type === 'file') part.file.resume();
                invalidMultipartField();
            }
            seenFields.add(part.fieldname);

            if (part.type === 'file') {
                if (!FILE_FIELDS.has(part.fieldname)) {
                    part.file.resume();
                    invalidMultipartField();
                }

                const field = part.fieldname as ImageField;
                const directory = field === 'photo' ? 'avatars' : 'banners';
                const uploadId = randomUUID();
                const temporary = safeUploadPath(directory, `.${userId}_${uploadId}.tmp`);
                temporaryPaths.push(temporary.filepath);
                await fs.mkdir(temporary.baseDirectory, { recursive: true });

                const file = await fs.open(temporary.filepath, 'wx', 0o600);
                let size = 0;
                let signature = Buffer.alloc(0);
                try {
                    for await (const value of part.file) {
                        const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
                        size += chunk.length;
                        if (size > MAX_UPLOAD_SIZE) {
                            AppError.throw('Arquivo muito grande ou vazio.', 400);
                        }
                        if (signature.length < 12) {
                            signature = Buffer.concat([
                                signature,
                                chunk.subarray(0, 12 - signature.length),
                            ]);
                        }

                        let offset = 0;
                        while (offset < chunk.length) {
                            const { bytesWritten } = await file.write(
                                chunk,
                                offset,
                                chunk.length - offset,
                                null,
                            );
                            if (bytesWritten === 0) {
                                throw new Error('Não foi possível gravar o upload.');
                            }
                            offset += bytesWritten;
                        }
                    }
                } finally {
                    await file.close();
                }

                if (part.file.truncated || size === 0) {
                    AppError.throw('Arquivo muito grande ou vazio.', 400);
                }

                const imageType = detectImageType(signature);
                if (!imageType) {
                    AppError.throw('Arquivo inválido. Use uma imagem JPEG, PNG ou WebP.', 400);
                }
                if (part.mimetype.toLowerCase() !== imageType.mime) {
                    AppError.throw('O MIME informado não corresponde ao conteúdo da imagem.', 400);
                }

                const filename = `${userId}_${uploadId}${imageType.extension}`;
                uploads.push({
                    field,
                    directory,
                    temporaryPath: temporary.filepath,
                    finalPath: safeUploadPath(directory, filename).filepath,
                    url: `/uploads/${directory}/${filename}`,
                });
                continue;
            }

            if (
                !['username', 'bio'].includes(part.fieldname) ||
                part.fieldnameTruncated ||
                part.valueTruncated ||
                typeof part.value !== 'string'
            ) {
                invalidMultipartField();
            }
            if (part.fieldname === 'username') payload.username = part.value;
            if (part.fieldname === 'bio') payload.bio = part.value;
        }

        if (seenFields.size === 0) {
            AppError.throw('Informe ao menos um campo para atualizar.', 400);
        }

        return { payload, uploads };
    } catch (error) {
        await removeProfileFiles([...temporaryPaths, ...uploads.map((upload) => upload.finalPath)]);
        throw error;
    }
}

export async function removeProfileFiles(paths: readonly string[]) {
    await removeLocalUploadPaths(paths);
}

export async function commitProfileUploads(uploads: readonly StagedUpload[]) {
    for (const upload of uploads) {
        await fs.rename(upload.temporaryPath, upload.finalPath);
    }
}

export function localProfileFilePath(
    url: string | null | undefined,
    directory: 'avatars' | 'banners',
) {
    return localUploadPath(url, directory);
}

function safeUploadPath(directory: 'avatars' | 'banners', filename: string) {
    const baseDirectory = path.resolve(process.cwd(), 'public', directory);
    const filepath = path.resolve(baseDirectory, filename);
    if (path.dirname(filepath) !== baseDirectory) {
        AppError.throw('Caminho de upload inválido.', 400);
    }
    return { baseDirectory, filepath };
}
