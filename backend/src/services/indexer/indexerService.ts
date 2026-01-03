import { GraphQLClient } from 'graphql-request'
import prisma from '../../lib/prisma'
import dotenv from 'dotenv'

dotenv.config()

const SUBGRAPH_URL = process.env.SUBGRAPH_URL!
const POLL_INTERVAL_MS = parseInt(process.env.INDEXER_POLL_INTERVAL_MS || '30000')
const SNAPSHOT_INTERVAL_MS = parseInt(process.env.SNAPSHOT_INTERVAL_MS || '300000')

if (!SUBGRAPH_URL) {
  throw new Error('SUBGRAPH_URL is required in .env')
}

// GraphQL Queries - CORRECTED VERSION
const QUERIES = {
  MINT: `
    query GetMints($first: Int!, $skip: Int!, $blockNumber: Int!) {
      mints(
        first: $first
        skip: $skip
        orderBy: blockNumber
        orderDirection: asc
        where: { blockNumber_gt: $blockNumber }
      ) {
        id
        to
        amount
        timestamp
        blockNumber
        transactionHash
        logIndex
        minter
      }
    }
  `,
  
  BURN: `
    query GetBurns($first: Int!, $skip: Int!, $blockNumber: Int!) {
      burns(
        first: $first
        skip: $skip
        orderBy: blockNumber
        orderDirection: asc
        where: { blockNumber_gt: $blockNumber }
      ) {
        id
        from
        amount
        timestamp
        blockNumber
        transactionHash
        logIndex
        burner
      }
    }
  `,
  
  TRANSFER: `
    query GetTransfers($first: Int!, $skip: Int!, $blockNumber: Int!) {
      transfers(
        first: $first
        skip: $skip
        orderBy: blockNumber
        orderDirection: asc
        where: { blockNumber_gt: $blockNumber }
      ) {
        id
        from
        to
        amount
        blockTimestamp
        blockNumber
        txhash
        logIndex
      }
    }
  `,
  
  BLACKLISTED: `
    query GetBlacklisted($first: Int!, $skip: Int!, $blockNumber: Int!) {
      blacklisteds(
        first: $first
        skip: $skip
        orderBy: blockNumber
        orderDirection: asc
        where: { blockNumber_gt: $blockNumber }
      ) {
        id
        account
        timestamp
        blockNumber
        transactionHash
        logIndex
        blacklister
      }
    }
  `,
  
  UNBLACKLISTED: `
    query GetUnBlacklisted($first: Int!, $skip: Int!, $blockNumber: Int!) {
      unBlacklisteds(
        first: $first
        skip: $skip
        orderBy: blockNumber
        orderDirection: asc
        where: { blockNumber_gt: $blockNumber }
      ) {
        id
        account
        timestamp
        blockNumber
        transactionHash
        logIndex
        blacklister
      }
    }
  `
}

export class IndexerService {
  private client = new GraphQLClient(SUBGRAPH_URL)
  private lastProcessedBlock = 0
  private isRunning = false

  async start() {
    if (this.isRunning) {
      console.log('Indexer is already running')
      return
    }

    console.log('🚀 Starting Koma token indexer...')
    
    try {
      // Get the latest block from database
      const [latestMint, latestBurn, latestTransfer] = await Promise.all([
        prisma.mintEvent.aggregate({ _max: { blockNumber: true } }),
        prisma.burnEvent.aggregate({ _max: { blockNumber: true } }),
        prisma.transferEvent.aggregate({ _max: { blockNumber: true } })
      ])

      this.lastProcessedBlock = Math.max(
        latestMint._max.blockNumber || 0,
        latestBurn._max.blockNumber || 0,
        latestTransfer._max.blockNumber || 0
      )

      console.log(`📊 Starting from block: ${this.lastProcessedBlock}`)

      // Start polling intervals
      setInterval(() => this.pollEvents(), POLL_INTERVAL_MS)
      setInterval(() => this.takeSnapshot(), SNAPSHOT_INTERVAL_MS)

      // Initial poll
      await this.pollEvents()
      
      this.isRunning = true
      console.log('✅ Indexer started successfully')
    } catch (error) {
      console.error('Failed to start indexer:', error)
    }
  }

  private async pollEvents() {
    try {
      console.log('🔄 Polling for new events...')
      
      // Process all event types in parallel
      await Promise.all([
        this.processMints(),
        this.processBurns(),
        this.processTransfers(),
        this.processBlacklisted(),
        this.processUnBlacklisted()
      ])

      console.log('✅ Event polling completed')
    } catch (error) {
      console.error('Error polling events:', error)
      await this.createAlert('ERROR', 'Indexer Poll Error', `Failed to poll events: ${error}`)
    }
  }

  private async processMints() {
    try {
      const events = await this.fetchEvents('mints', QUERIES.MINT)
      
      for (const event of events) {
        const exists = await prisma.mintEvent.findFirst({
          where: { 
            txHash: event.transactionHash, 
            logIndex: parseInt(event.logIndex) 
          }
        })

        if (!exists) {
          await prisma.mintEvent.create({
            data: {
              txHash: event.transactionHash,
              logIndex: parseInt(event.logIndex),
              blockNumber: parseInt(event.blockNumber),
              blockTimestamp: new Date(parseInt(event.timestamp) * 1000),
              toAddress: Buffer.from(event.to.slice(2), 'hex'),
              amount: BigInt(event.amount),
              minter: Buffer.from(event.minter.slice(2), 'hex')
            }
          })

          this.updateLastBlock(parseInt(event.blockNumber))
          console.log(`✅ Processed mint: ${event.id}`)
        }
      }
    } catch (error) {
      console.error('Error processing mints:', error)
    }
  }

  private async processBurns() {
    try {
      const events = await this.fetchEvents('burns', QUERIES.BURN)
      
      for (const event of events) {
        const exists = await prisma.burnEvent.findFirst({
          where: { 
            txHash: event.transactionHash, 
            logIndex: parseInt(event.logIndex) 
          }
        })

        if (!exists) {
          await prisma.burnEvent.create({
            data: {
              txHash: event.transactionHash,
              logIndex: parseInt(event.logIndex),
              blockNumber: parseInt(event.blockNumber),
              blockTimestamp: new Date(parseInt(event.timestamp) * 1000),
              fromAddress: Buffer.from(event.from.slice(2), 'hex'),
              amount: BigInt(event.amount),
              burner: Buffer.from(event.burner.slice(2), 'hex')
            }
          })

          this.updateLastBlock(parseInt(event.blockNumber))
          console.log(`✅ Processed burn: ${event.id}`)
        }
      }
    } catch (error) {
      console.error('Error processing burns:', error)
    }
  }

  private async processTransfers() {
    try {
      const events = await this.fetchEvents('transfers', QUERIES.TRANSFER)
      
      for (const event of events) {
        const exists = await prisma.transferEvent.findFirst({
          where: { 
            txHash: event.txhash, // Using txhash from subgraph
            logIndex: parseInt(event.logIndex) 
          }
        })

        if (!exists) {
          await prisma.transferEvent.create({
            data: {
              txHash: event.txhash, // Using txhash from subgraph
              logIndex: parseInt(event.logIndex),
              blockNumber: parseInt(event.blockNumber),
              blockTimestamp: new Date(parseInt(event.blockTimestamp) * 1000),
              fromAddress: Buffer.from(event.from.slice(2), 'hex'),
              toAddress: Buffer.from(event.to.slice(2), 'hex'),
              amount: BigInt(event.amount)
            }
          })

          this.updateLastBlock(parseInt(event.blockNumber))
          console.log(`✅ Processed transfer: ${event.id}`)
        }
      }
    } catch (error) {
      console.error('Error processing transfers:', error)
    }
  }

  private async processBlacklisted() {
    try {
      const events = await this.fetchEvents('blacklisteds', QUERIES.BLACKLISTED)
      
      for (const event of events) {
        const exists = await prisma.blacklistedEvent.findFirst({
          where: { 
            txHash: event.transactionHash, 
            logIndex: parseInt(event.logIndex) 
          }
        })

        if (!exists) {
          await prisma.blacklistedEvent.create({
            data: {
              txHash: event.transactionHash,
              logIndex: parseInt(event.logIndex),
              blockNumber: parseInt(event.blockNumber),
              blockTimestamp: new Date(parseInt(event.timestamp) * 1000),
              account: Buffer.from(event.account.slice(2), 'hex'),
              blacklister: Buffer.from(event.blacklister.slice(2), 'hex')
            }
          })

          this.updateLastBlock(parseInt(event.blockNumber))
          console.log(`✅ Processed blacklist: ${event.account}`)
        }
      }
    } catch (error) {
      console.error('Error processing blacklisted events:', error)
    }
  }

  private async processUnBlacklisted() {
    try {
      const events = await this.fetchEvents('unBlacklisteds', QUERIES.UNBLACKLISTED)
      
      for (const event of events) {
        const exists = await prisma.unBlacklistedEvent.findFirst({
          where: { 
            txHash: event.transactionHash, 
            logIndex: parseInt(event.logIndex) 
          }
        })

        if (!exists) {
          await prisma.unBlacklistedEvent.create({
            data: {
              txHash: event.transactionHash,
              logIndex: parseInt(event.logIndex),
              blockNumber: parseInt(event.blockNumber),
              blockTimestamp: new Date(parseInt(event.timestamp) * 1000),
              account: Buffer.from(event.account.slice(2), 'hex'),
              blacklister: Buffer.from(event.blacklister.slice(2), 'hex')
            }
          })

          this.updateLastBlock(parseInt(event.blockNumber))
          console.log(`✅ Processed unblacklist: ${event.account}`)
        }
      }
    } catch (error) {
      console.error('Error processing unblacklisted events:', error)
    }
  }

  private async fetchEvents(dataKey: string, query: string): Promise<any[]> {
    let skip = 0
    const events: any[] = []
    const BATCH_SIZE = 100

    while (true) {
      try {
        const variables = {
          first: BATCH_SIZE,
          skip,
          blockNumber: this.lastProcessedBlock
        }

        const data: any = await this.client.request(query, variables)
        const fetchedEvents = data[dataKey]

        if (!fetchedEvents || fetchedEvents.length === 0) {
          break
        }

        events.push(...fetchedEvents)

        if (fetchedEvents.length < BATCH_SIZE) {
          break
        }

        skip += BATCH_SIZE
      } catch (error: any) {
        console.error(`Error fetching ${dataKey}:`, error.message)
        break
      }
    }

    return events
  }

  private updateLastBlock(blockNumber: number) {
    if (blockNumber > this.lastProcessedBlock) {
      this.lastProcessedBlock = blockNumber
    }
  }

  private async takeSnapshot() {
    try {
      console.log('📸 Taking token snapshot...')

      // Calculate totals
      const [totalMinted, totalBurned, uniqueHolders, totalTransfers] = await Promise.all([
        prisma.mintEvent.aggregate({ _sum: { amount: true } }),
        prisma.burnEvent.aggregate({ _sum: { amount: true } }),
        this.getUniqueHoldersCount(),
        prisma.transferEvent.count()
      ])

      const totalSupply = (totalMinted._sum.amount || 0n) - (totalBurned._sum.amount || 0n)

      await prisma.tokenSnapshot.create({
        data: {
          snapshotTime: new Date(),
          totalSupply,
          totalMinted: totalMinted._sum.amount || 0n,
          totalBurned: totalBurned._sum.amount || 0n,
          uniqueHolders,
          totalTransactions: totalTransfers,
          latestBlockNumber: BigInt(this.lastProcessedBlock)
        }
      })

      console.log('✅ Snapshot created')
    } catch (error) {
      console.error('Error creating snapshot:', error)
    }
  }

  private async getUniqueHoldersCount(): Promise<number> {
    const fromAddresses = await prisma.transferEvent.findMany({
      distinct: ['fromAddress'],
      select: { fromAddress: true }
    })

    const toAddresses = await prisma.transferEvent.findMany({
      distinct: ['toAddress'],
      select: { toAddress: true }
    })

    const allAddresses = new Set<string>()
    fromAddresses.forEach(event => allAddresses.add(event.fromAddress.toString()))
    toAddresses.forEach(event => allAddresses.add(event.toAddress.toString()))

    // Add mint recipients
    const mintRecipients = await prisma.mintEvent.findMany({
      distinct: ['toAddress'],
      select: { toAddress: true }
    })
    mintRecipients.forEach(event => allAddresses.add(event.toAddress.toString()))

    return allAddresses.size
  }

  private async createAlert(severity: string, title: string, description: string) {
    try {
      await prisma.systemAlert.create({
        data: {
          severity,
          title,
          description,
          source: 'INDEXER'
        }
      })
    } catch (error) {
      console.error('Error creating alert:', error)
    }
  }
}

export const indexerService = new IndexerService()