import { app } from './conf.js'
import 'dotenv/config'
import { bootstrap } from './bootstrap.js'

const PORT: number = Number(process.env.PORT)
const HOST: string = String(process.env.HOST)

async function main() 
{
    try {
        await bootstrap()

        await app.listen({ host: HOST, port: PORT })
        app.log.info(`🚀 Server running at ${HOST}:${PORT}`)
    } catch(e) {
        app.log.error(e)
        process.exit(1)
    }
}

main()