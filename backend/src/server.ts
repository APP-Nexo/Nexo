import { app } from './conf.js';
import 'dotenv/config';

const PORT: number = Number(process.env.PORT)
const HOST: string = String(process.env.HOST)

try {
    app.listen({ host: HOST, port: PORT })
} catch(e) {
    app.log.error(e)
    process.exit(1);
}