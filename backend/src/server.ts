import { app } from './conf.js'
import 'dotenv/config'
import { bootstrap } from './bootstrap.js'

const PORT: number = Number(process.env.PORT)
const HOST: string = String(process.env.HOST)

async function main() 
{
    try {
        const { version } = await bootstrap()

        await app.listen({ host: HOST, port: PORT })
        app.log.info(`🚀 Server running at ${HOST}:${PORT}`)
        app.log.info(`📦 App version: ${version?.appVersion} | DB version: ${version?.dbVersion}`)
    } catch(e) {
        app.log.error(e)
        process.exit(1)
    }
}

main()