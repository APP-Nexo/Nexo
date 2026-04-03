import { app } from './conf.js'
import 'dotenv/config'
import { bootstrap } from './bootstrap.js'

const PORT: number = Number(process.env.PORT)
const HOST: string = String(process.env.HOST)

async function main() 
{
    try {

        await app.listen({ host: HOST, port: PORT })
        app.log.info(`🚀 Server running at http://${HOST}:${PORT}`)
        app.log.info(`📚 Swagger running at http://${HOST}:${PORT}/docs`)
        await bootstrap()
    } catch(e) {
        app.log.error(e)
        process.exit(1)
    }
}

main()