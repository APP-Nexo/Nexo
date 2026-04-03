import { app } from '../../src/core/conf.js'

export async function startApp() {
    await app.ready()
    return app
}

export async function closeApp() {
    await app.close()
}
