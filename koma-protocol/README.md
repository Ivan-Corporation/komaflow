# Koma (KOMA)

Educational ERC20 project demonstrating:
- Upgradeable tokens (UUPS)
- Role-based minting
- Blacklisting (compliance)
- Arbitrum deployment
- Subgraph + backend ready


## Install

```bash
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts-upgradeable
forge install OpenZeppelin/openzeppelin-contracts
``` 

## Build

```bash
forge build
``` 

## Testing

Run the full test suite:

```bash
forge test
forge test -vvv
```

## Deployment (Arbitrum Sepolia)

```bash
forge script script/Deploy.s.sol \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --broadcast \
  --verify \
  --private-key $PRIVATE_KEY
``` 


## ABI

```bash
forge inspect src/Koma.sol:Koma abi --json > Koma.json
forge inspect src/KomaV2.sol:KomaV2 abi --json > KomaV2.json
``` 

## Upgrade (UUPS)

1. Deploy new implementation
2. Call upgradeTo() via proxy
3. Proxy address remains the same

Upgrade command:

```bash
forge script script/Upgrade.s.sol \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --broadcast \
  --verify \
  --private-key $PRIVATE_KEY


  cast call $KOMA_PROXY "version()(string)" --rpc-url $ARBITRUM_SEPOLIA_RPC
``` 


 ## Environment Setup

Create `.env`:

```env
PRIVATE_KEY=0x...
ADMIN=0xAdminAddress
MINTER=0xMinterAddress

ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_ONE_RPC=https://arb1.arbitrum.io/rpc

source .env


Deploy
bash
Copy code
forge script script/Deploy.s.sol \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --broadcast \
  --verify
Minting Tokens
Only the MINTER can mint.

bash
Copy code
cast send <KOMA_ADDRESS> \
  "mint(address,uint256)" \
  <TO> \
  <AMOUNT> \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --private-key <MINTER_PRIVATE_KEY>
Burning Tokens
bash
Copy code
cast send <KOMA_ADDRESS> \
  "burn(uint256)" \
  <AMOUNT> \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --private-key <USER_PRIVATE_KEY>
Blacklisting
Only ADMIN (blacklister) can blacklist.

bash
Copy code
cast send <KOMA_ADDRESS> \
  "blacklist(address)" \
  <USER> \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --private-key <ADMIN_PRIVATE_KEY>
Upgradeability
Koma uses UUPS upgradeability.
Only DEFAULT_ADMIN_ROLE can authorize upgrades.

yaml
Copy code

---

## You Are Now in a Very Good Spot ✅

- Contract = **final**
- Env = **realistic**
- Ops = **clear**
- Ready for **subgraph + backend**

👉 Next best step: **Subgraph schema & mappings**  
Just say **“subgraph”** and we continue 🚀