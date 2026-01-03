import {
  Minted,
  Burned,
  Blacklisted,
  UnBlacklisted,
  BlacklisterChanged,
  Transfer,
  Upgraded
} from "../generated/Koma/Koma";
import {
  Mint,
  Burn,
  Transfer as TransferEntity,
  Blacklisted as BlacklistedEntity,
  UnBlacklisted as UnBlacklistedEntity,
  BlacklisterChanged as BlacklisterChangedEntity,
  Upgrade as UpgradeEntity
} from "../generated/schema";

// Mint event handler
export function handleMinted(event: Minted): void {
  let mint = new Mint(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  
  mint.to = event.params.to;
  mint.amount = event.params.amount;
  mint.timestamp = event.block.timestamp;
  mint.blockNumber = event.block.number;
  mint.transactionHash = event.transaction.hash;
  mint.logIndex = event.logIndex;
  mint.minter = event.transaction.from;
  
  mint.save();
}

// Burn event handler (from burn() function)
export function handleBurned(event: Burned): void {
  let burn = new Burn(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  
  burn.from = event.params.from;
  burn.amount = event.params.amount;
  burn.timestamp = event.block.timestamp;
  burn.blockNumber = event.block.number;
  burn.transactionHash = event.transaction.hash;
  burn.logIndex = event.logIndex;
  burn.burner = event.transaction.from;
  
  burn.save();
}

// Transfer event handler
export function handleTransfer(event: Transfer): void {
  let transfer = new TransferEntity(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  
  transfer.txhash = event.transaction.hash;
  transfer.logIndex = event.logIndex;
  transfer.blockNumber = event.block.number;
  transfer.blockTimestamp = event.block.timestamp;
  transfer.amount = event.params.value;
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  
  transfer.save();
}

// Blacklisted event handler
export function handleBlacklisted(event: Blacklisted): void {
  let blacklisted = new BlacklistedEntity(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  
  blacklisted.account = event.params._account;
  blacklisted.timestamp = event.block.timestamp;
  blacklisted.blockNumber = event.block.number;
  blacklisted.transactionHash = event.transaction.hash;
  blacklisted.logIndex = event.logIndex;
  blacklisted.blacklister = event.transaction.from;
  
  blacklisted.save();
}

// UnBlacklisted event handler
export function handleUnBlacklisted(event: UnBlacklisted): void {
  let unBlacklisted = new UnBlacklistedEntity(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  
  unBlacklisted.account = event.params._account;
  unBlacklisted.timestamp = event.block.timestamp;
  unBlacklisted.blockNumber = event.block.number;
  unBlacklisted.transactionHash = event.transaction.hash;
  unBlacklisted.logIndex = event.logIndex;
  unBlacklisted.blacklister = event.transaction.from;
  
  unBlacklisted.save();
}

// BlacklisterChanged event handler
export function handleBlacklisterChanged(event: BlacklisterChanged): void {
  let blacklisterChanged = new BlacklisterChangedEntity(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  
  blacklisterChanged.newBlacklister = event.params.newBlacklister;
  blacklisterChanged.timestamp = event.block.timestamp;
  blacklisterChanged.blockNumber = event.block.number;
  blacklisterChanged.transactionHash = event.transaction.hash;
  blacklisterChanged.logIndex = event.logIndex;
  
  blacklisterChanged.save();
}

// Upgrade event handler
export function handleUpgraded(event: Upgraded): void {
  let upgrade = new UpgradeEntity(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  
  upgrade.implementation = event.params.implementation;
  upgrade.timestamp = event.block.timestamp;
  upgrade.blockNumber = event.block.number;
  upgrade.transactionHash = event.transaction.hash;
  upgrade.logIndex = event.logIndex;
  upgrade.upgrader = event.transaction.from;
  
  upgrade.save();
}