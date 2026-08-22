import path from 'path';
import type { Level } from 'pino';
import pino from 'pino';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Logs {
    private static createLogger(filename: string) {
        return pino(
            {
                timestamp: () => {
                    const date = new Date().toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                    });
                    return `,"time":"${date}"`;
                },
            },
            pino.destination({
                dest: path.join(__dirname, '..', '..', '..', '..', 'logs', `${filename}.log`),
                mkdir: true,
                sync: true,
            }),
        );
    }

    private static createPrettyLogger() {
        return pino({
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:dd/mm/yyyy HH:MM:ss',
                    ignore: 'pid,hostname',
                    levelFirst: true,
                },
            },
        });
    }

    static write(
        data: object,
        message: string,
        type: Level,
        pretty = false,
        file = process.env.NODE_ENV !== 'production',
    ) {
        const keys = Object.keys(data);
        const logFilename: any = keys.length > 0 ? keys[0] : 'default';

        if (file) {
            const logger = Logs.createLogger(logFilename);
            logger[type](data, message);
        }

        if (pretty) {
            const prettyLogger = Logs.createPrettyLogger();
            prettyLogger[type](data, message);
        }
    }
}
