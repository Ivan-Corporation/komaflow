# Koma (KOMA)

**Koma** is an educational ERC20 project demonstrating modern,
production-grade token patterns.

## Features

-   Upgradeable ERC20 (UUPS)
-   Role-based minting
-   Blacklisting / compliance controls
-   Arbitrum deployment (Sepolia + One)
-   Subgraph & backend ready

## Installation

``` bash
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts-upgradeable
forge install OpenZeppelin/openzeppelin-contracts
```

## Build

``` bash
forge build
```

## Testing

``` bash
forge test
forge test -vvv
```

## Deployment (Arbitrum Sepolia)

``` bash
forge script script/Deploy.s.sol \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --broadcast \
  --verify \
  --private-key $PRIVATE_KEY
```

## ABI Generation

``` bash
forge inspect src/Koma.sol:Koma abi --json > Koma.json
forge inspect src/KomaV2.sol:KomaV2 abi --json > KomaV2.json
```

## Upgradeability (UUPS)

1.  Deploy new implementation\
2.  Call `upgradeTo()` via proxy\
3.  Proxy address remains the same

``` bash
forge script script/Upgrade.s.sol \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --broadcast \
  --verify \
  --private-key $PRIVATE_KEY
```

Verify upgrade:

``` bash
cast call $KOMA_PROXY "version()(string)" --rpc-url $ARBITRUM_SEPOLIA_RPC
```

## Environment Setup

Create `.env`:

``` env
PRIVATE_KEY=0x...
ADMIN=0xAdminAddress
MINTER=0xMinterAddress

ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_ONE_RPC=https://arb1.arbitrum.io/rpc
```

``` bash
source .env
```

## Minting Tokens

``` bash
cast send <KOMA_ADDRESS> \
  "mint(address,uint256)" \
  <TO> \
  <AMOUNT> \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --private-key <MINTER_PRIVATE_KEY>
```

## Burning Tokens

``` bash
cast send <KOMA_ADDRESS> \
  "burn(uint256)" \
  <AMOUNT> \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --private-key <USER_PRIVATE_KEY>
```

## Blacklisting

``` bash
cast send <KOMA_ADDRESS> \
  "blacklist(address)" \
  <USER> \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --private-key <ADMIN_PRIVATE_KEY>
```

## Roles

-   DEFAULT_ADMIN_ROLE -- upgrades & role management\
-   MINTER_ROLE -- minting\
-   BLACKLISTER_ROLE -- compliance

## Status

Ready for subgraph & backend integration 🚀
