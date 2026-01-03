import { IndexerService } from './indexerService';
import { systemHealthService } from '../systemHealthService';
import { MinterIndexerService } from './minterIndexerService';
import { Indexer } from './types';

export class IndexerManager {
  private indexers: Map<string, Indexer> = new Map();
  private isRunning = false;

  constructor() {
    this.registerIndexers();
  }

  private registerIndexers() {
    const dashboardIndexer = new IndexerService();
    this.indexers.set('dashboard', {
      name: 'dashboard',
      instance: dashboardIndexer,
      start: () => dashboardIndexer.startPolling(),
      stop: async () => { /* Add stop method if needed */ }
    });

    const subgraphUrl = process.env.MINTER_SUBGRAPH_URL || process.env.SUBGRAPH_URL!;
    const minterIndexer = new MinterIndexerService(subgraphUrl);
    this.indexers.set('minter', {
      name: 'minter',
      instance: minterIndexer,
      start: () => minterIndexer.start(),
      stop: () => minterIndexer.stop()
    });

    // Add more indexers here in the future
  }

  async startAll() {
    if (this.isRunning) {
      console.log('Indexer manager is already running');
      return;
    }

    console.log('🚀 Starting all indexers...');
    
    try {
      // Test system health first
      await systemHealthService.runHealthChecks();
      
      // Start all indexers in parallel
      const startPromises = Array.from(this.indexers.values()).map(async (indexer) => {
        try {
          console.log(`Starting ${indexer.name} indexer...`);
          await indexer.start();
          console.log(`✅ ${indexer.name} indexer started successfully`);
        } catch (error) {
          console.error(`❌ Failed to start ${indexer.name} indexer:`, error);
        }
      });

      await Promise.all(startPromises);
      this.isRunning = true;
      
      console.log('🎉 All indexers started successfully');
    } catch (error) {
      console.error('Failed to start indexers:', error);
    }
  }

  async stopAll() {
    console.log('🛑 Stopping all indexers...');
    
    const stopPromises = Array.from(this.indexers.values()).map(async (indexer) => {
      try {
        if (indexer.stop) {
          await indexer.stop();
          console.log(`✅ ${indexer.name} indexer stopped`);
        }
      } catch (error) {
        console.error(`Error stopping ${indexer.name} indexer:`, error);
      }
    });

    await Promise.all(stopPromises);
    this.isRunning = false;
    console.log('All indexers stopped');
  }

  getIndexer(name: string): Indexer | undefined {
    return this.indexers.get(name);
  }

  getAllIndexers(): Indexer[] {
    return Array.from(this.indexers.values());
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      indexers: this.getAllIndexers().map(indexer => ({
        name: indexer.name,
        status: 'running'
      }))
    };
  }
}

export const indexerManager = new IndexerManager();