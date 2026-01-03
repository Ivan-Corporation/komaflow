export interface SubgraphEvent {
  id: string;
  transactionHash: string;
  blockNumber: string;
  timestamp: string;
  logIndex?: string;
}

export interface MintEvent extends SubgraphEvent {
  recipient: string;
  amount: string;
  mintType: string;
  sender: string;
}

export interface DepositEvent extends SubgraphEvent {
  sender: string;
  owner: string;
  assets: string;
  shares: string;
}

export interface StakedEvent extends SubgraphEvent {
  user: string;
  assets: string;
}

export interface BurnEvent extends SubgraphEvent {
  user: string;
  amount: string;
  sender: string;
}

export interface WithdrawEvent extends SubgraphEvent {
  sender: string;
  receiver: string;
  owner: string;
  assets: string;
  shares: string;
}

export interface WithdrawClaimedEvent extends SubgraphEvent {
  user: string;
  assets: string;
}

export interface YieldDistributedEvent extends SubgraphEvent {
  amount: string;
  distributionTimestamp: string;
}

export type EventProcessor = {
  query: string;
  dataKey: string;
  process: (event: any) => Promise<void>;
  checkExists: (event: any) => Promise<boolean>;
};

export interface Indexer {
  name: string;
  instance: any;
  start: () => Promise<void>;
  stop?: () => Promise<void>;
}
