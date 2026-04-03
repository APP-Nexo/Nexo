import { DatabaseErrors } from "../utils/prisma/database-errors.js"

export class GenericQueries<T> {
    constructor(private model: any) {}

    async create(data: any): Promise<T> 
    {
        try 
        {
            return await this.model.create({ data })
        } catch(e) {
            console.error('Erro in create:', e)
            DatabaseErrors.throwQueryFailed()
        }
    }

    async createMany(data: any[]): Promise<void> 
    {
        try 
        {
            await this.model.createMany({
            data,
            skipDuplicates: true,
            })
        } catch(e) {
            console.error('Erro in createMany:', e)
            DatabaseErrors.throwQueryFailed()
        }
    }

    async findMany(filter = {}): Promise<T[]> 
    {
        try 
        {
            return await this.model.findMany({ where: filter })
        } catch(e) {
            console.error('Erro in findMany:', e)
            DatabaseErrors.throwQueryFailed()
        }
    }

    async findManyWithOptions(options: any): Promise<T[]> 
    {
        try 
        {
            return await this.model.findMany(options)
        } catch(e) {
            console.error('Erro in findManyWithOptions:', e)
            DatabaseErrors.throwQueryFailed()
        }
    }

    async findUnique(where: any): Promise<T | null> 
    {
        try 
        {
            return await this.model.findUnique({ where })
        } catch(e) {
            console.error('Erro in findUnique:', e)
            DatabaseErrors.throwQueryFailed()
        }
    }

    async findFirst(filter = {}): Promise<T | null> 
    {
        try {
            return await this.model.findFirst({ where: filter })
        } catch(e) {
            console.error('Erro in findFirst:', e)
            DatabaseErrors.throwQueryFailed()
        }
    }

    async findLatest(): Promise<T | null> 
    {
        try {
            return await this.model.findFirst({
            orderBy: { createdAt: 'desc' }
            })
        } catch(e) {
            console.error('Erro in findLatest:', e)
            DatabaseErrors.throwQueryFailed()
        }
    }

    async update(id: string | number, data: any): Promise<T> 
    {
        try 
        {
            return await this.model.update({ where: { id }, data })
        } catch(e) {
            console.error('Erro in update:', e)
            DatabaseErrors.throwQueryFailed()
        }
    }

    async delete(id: string | number): Promise<T> 
    {
        try 
        {
            return await this.model.delete({ where: { id } })
        } catch(e) {
            console.error('Erro in delete:', e)
            DatabaseErrors.throwQueryFailed()
        }
    }
}