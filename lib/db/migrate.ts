import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { migrate } from 'drizzle-orm/neon-http/migrator'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in .env file')
}

async function runMigrations() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const db = drizzle(sql)

    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('Migrations completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigrations()
