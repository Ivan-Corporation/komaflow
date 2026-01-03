import axios from 'axios'
import prisma from '../../lib/prisma'
import { getTimeframeRange, Timeframe } from '../../utils/timeframeUtils'

const BASE_URL = 'http://localhost:4000/api'

export interface TestResult {
  name: string
  passed: boolean
  message: string
  data?: any
  error?: any
}

export interface TestEndpoint {
  path: string
  name: string
  requiredKeys?: string[]
}

export async function testEndpoint(
  endpoint: TestEndpoint,
  params?: Record<string, string>
): Promise<TestResult> {
  try {
    const url = `${BASE_URL}${endpoint.path}${params ? `?${new URLSearchParams(params)}` : ''}`
    
    console.log(`Testing: ${endpoint.name}`)
    console.log(`URL: ${url}`)
    
    const response = await axios.get(url)
    
    if (response.status !== 200) {
      return {
        name: endpoint.name,
        passed: false,
        message: `Status ${response.status}`,
        error: response.data
      }
    }
    
    // Check required keys
    if (endpoint.requiredKeys) {
      const missingKeys = endpoint.requiredKeys.filter(key => !(key in response.data))
      if (missingKeys.length > 0) {
        return {
          name: endpoint.name,
          passed: false,
          message: `Missing keys: ${missingKeys.join(', ')}`,
          data: response.data
        }
      }
    }
    
    return {
      name: endpoint.name,
      passed: true,
      message: 'OK',
      data: response.data
    }
  } catch (error: any) {
    return {
      name: endpoint.name,
      passed: false,
      message: error.message,
      error: error.response?.data
    }
  }
}

export function printTestResult(result: TestResult): void {
  const icon = result.passed ? '✅' : '❌'
  console.log(`${icon} ${result.name}: ${result.message}`)
  
  if (result.data && !result.passed) {
    console.log('   Data:', JSON.stringify(result.data, null, 2).split('\n').slice(0, 5).join('\n'))
  }
  
  if (result.error) {
    console.log('   Error:', result.error)
  }
}

export async function testAllTimeframes(
  endpoint: Omit<TestEndpoint, 'name'>,
  timeframes: Timeframe[] = ['1h', '8h', '24h', '7d', '1month', 'allTime']
): Promise<TestResult[]> {
  const results: TestResult[] = []
  
  for (const timeframe of timeframes) {
    const result = await testEndpoint({
      ...endpoint,
      name: `${endpoint.path}?timeframe=${timeframe}`
    }, { timeframe })
    
    results.push(result)
    
    // Print timeframe-specific info
    if (result.passed && result.data) {
      const { from, to } = getTimeframeRange(timeframe)
      console.log(`   ⏱️  Timeframe: ${timeframe}`)
      console.log(`   📅 From: ${from.toISOString()}`)
      console.log(`   📅 To: ${to.toISOString()}`)
      
      // Show data summary
      if (result.data.total_deposits_btc) {
        console.log(`   💰 Total: ${result.data.total_deposits_btc} BTC`)
      }
      if (result.data.total_withdraws_btc) {
        console.log(`   💰 Total: ${result.data.total_withdraws_btc} BTC`)
      }
      if (result.data.count !== undefined) {
        console.log(`   📊 Count: ${result.data.count}`)
      }
      if (result.data.deposits) {
        console.log(`   📥 Deposits: ${result.data.deposits.length}`)
      }
      if (result.data.withdraws) {
        console.log(`   📤 Withdraws: ${result.data.withdraws.length}`)
      }
    }
  }
  
  return results
}

export async function testDatabaseState(): Promise<TestResult> {
  try {
    const counts = await Promise.all([
      prisma.depositEvent.count(),
      prisma.withdrawEvent.count(),
      prisma.withdrawClaimedEvent.count(),
      prisma.yieldDistributedEvent.count(),
      prisma.hbtcMintEvent.count(),
      prisma.hbtcBurnEvent.count()
    ])
    
    return {
      name: 'Database State',
      passed: true,
      message: `Events: Deposits(${counts[0]}), Withdraws(${counts[1]}), Claims(${counts[2]}), Yields(${counts[3]}), Mints(${counts[4]}), Burns(${counts[5]})`,
      data: {
        depositEvents: counts[0],
        withdrawEvents: counts[1],
        withdrawClaimedEvents: counts[2],
        yieldDistributedEvents: counts[3],
        mintEvents: counts[4],
        burnEvents: counts[5]
      }
    }
  } catch (error: any) {
    return {
      name: 'Database State',
      passed: false,
      message: error.message,
      error
    }
  }
}

export async function testSampleData(endpoint: string): Promise<TestResult> {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}?limit=1`)
    
    if (response.data.deposits && response.data.deposits.length > 0) {
      const sample = response.data.deposits[0]
      return {
        name: 'Sample Data Check',
        passed: true,
        message: `Found sample deposit: ${sample.tx_hash?.slice(0, 20)}...`,
        data: sample
      }
    }
    
    if (response.data.withdraws && response.data.withdraws.length > 0) {
      const sample = response.data.withdraws[0]
      return {
        name: 'Sample Data Check',
        passed: true,
        message: `Found sample withdraw: ${sample.tx_hash?.slice(0, 20)}...`,
        data: sample
      }
    }
    
    return {
      name: 'Sample Data Check',
      passed: false,
      message: 'No sample data found',
      data: response.data
    }
  } catch (error: any) {
    return {
      name: 'Sample Data Check',
      passed: false,
      message: error.message,
      error: error.response?.data
    }
  }
}