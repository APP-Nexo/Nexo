import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.tests.ts'],
        coverage: {
            reporter: ['text', 'html']
        }
    }
})