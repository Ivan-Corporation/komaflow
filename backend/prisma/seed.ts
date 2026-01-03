import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting database initialization...')
  
  try {
    // Check existing tables
    const tablesResult:any = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    
    console.log('Existing tables:', tablesResult)
    
    if (tablesResult.length === 0) {
      console.log('No tables found, running migrations...')
    }
    
  } catch (error) {
    console.error('Error checking tables:', error)
  }
  
  // Create initial system alert
  const existingAlert = await prisma.systemAlert.findFirst({
    where: {
      title: 'System Initialized'
    }
  })
  
  if (!existingAlert) {
    await prisma.systemAlert.create({
      data: {
        severity: 'INFO',
        title: 'System Initialized',
        description: 'Koma token dashboard system has been initialized successfully',
        source: 'SYSTEM'
      }
    })
    console.log('Created initial system alert')
  }
  
  console.log('Database initialization completed')
}

main()
  .catch((e) => {
    console.error('Initialization error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })