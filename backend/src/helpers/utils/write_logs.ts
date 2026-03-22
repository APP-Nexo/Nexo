import pino from 'pino';
import type { Level } from 'pino';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Logs 
{
    private static createLogger(filename: string) 
    {
        return pino({
            timestamp: () => {
            const date = new Date().toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo"
            });
            return `,"time":"${date}"`;
        }
        },
            pino.destination({
                dest: path.join(__dirname, '..', '..', '..', 'logs', `${filename}.log`),
                mkdir: true,
                sync: false 
            })
        );
    }

    private static createPrettyLogger() 
    {
        return pino({
            transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:dd/mm/yyyy HH:MM:ss',
                ignore: 'pid,hostname',
                levelFirst: true,
            }
            }
        });
    }

    static write(data: object, message: string, type: Level, pretty = false, file = true)
    {
        const keys = Object.keys(data);
        const logFilename: any = keys.length > 0 ? keys[0] : 'default';

        if (file) {
            const logger = this.createLogger(logFilename);
            logger[type](data, message);
        }

        if (pretty) {
        const prettyLogger = this.createPrettyLogger();
        prettyLogger[type](data, message);
        }
    }
}