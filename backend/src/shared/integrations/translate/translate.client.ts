const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const MAX_CHUNK_LENGTH = 480;
const TIMEOUT_MS = 8_000;

function splitIntoChunks(text: string): string[] {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
        const candidate = current ? `${current} ${sentence}` : sentence;
        if (candidate.length > MAX_CHUNK_LENGTH && current) {
            chunks.push(current);
            current = sentence;
        } else {
            current = candidate;
        }
    }
    if (current) chunks.push(current);

    // A single sentence longer than the limit still needs a hard cut to stay under it.
    return chunks.flatMap((chunk) =>
        chunk.length <= MAX_CHUNK_LENGTH
            ? [chunk]
            : (chunk.match(new RegExp(`.{1,${MAX_CHUNK_LENGTH}}`, 'g')) ?? [chunk]),
    );
}

async function translateChunk(text: string): Promise<string> {
    const url = new URL(MYMEMORY_URL);
    url.searchParams.set('q', text);
    url.searchParams.set('langpair', 'en|pt-BR');

    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (!response.ok) return text;

        const payload = (await response.json()) as {
            responseData?: { translatedText?: unknown };
            responseStatus?: unknown;
        };
        // MyMemory returns HTTP 200 even when the request itself failed (e.g. daily
        // quota exhausted) — the real outcome is this inner field, and on failure
        // `translatedText` holds a human-readable warning, not a translation.
        if (payload.responseStatus !== 200) return text;

        const translated = payload.responseData?.translatedText;
        return typeof translated === 'string' && translated.trim().length > 0 ? translated : text;
    } catch {
        return text;
    }
}

/**
 * Best-effort EN->PT translation via MyMemory's free API (no key required).
 * Fails open: on any error the original text is returned so a flaky translation
 * service never breaks the game catalog sync.
 */
export async function translateToPortuguese(text: string): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return text;

    const chunks = splitIntoChunks(trimmed);
    const translated: string[] = [];
    for (const chunk of chunks) {
        translated.push(await translateChunk(chunk));
        // MyMemory's anonymous tier is rate-limited; a small delay between
        // sequential requests avoids tripping it during a multi-game sync.
        if (chunks.length > 1) await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return translated.join(' ');
}
