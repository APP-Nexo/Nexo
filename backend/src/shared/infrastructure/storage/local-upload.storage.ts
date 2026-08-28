import fs from 'node:fs/promises';
import path from 'node:path';

export type UploadDirectory = 'avatars' | 'banners';

export function localUploadPath(url: string | null | undefined, directory: UploadDirectory) {
    if (!url) return null;

    const prefix = `/uploads/${directory}/`;
    if (!url.startsWith(prefix)) return null;
    const filename = url.slice(prefix.length);
    if (!filename || filename !== path.basename(filename)) return null;

    const baseDirectory = path.resolve(process.cwd(), 'public', directory);
    const filepath = path.resolve(baseDirectory, filename);
    return path.dirname(filepath) === baseDirectory ? filepath : null;
}

export async function removeLocalUploadPaths(paths: readonly string[]) {
    await Promise.allSettled(paths.map((filepath) => fs.unlink(filepath)));
}

export async function removeLocalUploadUrls(
    uploads: readonly {
        directory: UploadDirectory;
        url: string | null | undefined;
    }[],
) {
    const paths = uploads
        .map((upload) => localUploadPath(upload.url, upload.directory))
        .filter((filepath): filepath is string => filepath !== null);
    const results = await Promise.allSettled(paths.map((filepath) => fs.unlink(filepath)));

    for (const [index, result] of results.entries()) {
        if (result.status === 'rejected') {
            console.warn('Falha ao remover upload substituído.', {
                filepath: paths[index],
                error: result.reason,
            });
        }
    }
}
