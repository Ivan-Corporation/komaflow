# Koma (KOMA)

Educational ERC20 project demonstrating:
- Upgradeable tokens (UUPS)
- Role-based minting
- Blacklisting (compliance)
- Arbitrum deployment
- Subgraph + backend ready

## Deployment (Arbitrum Sepolia)

```bash
forge script script/Deploy.s.sol \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --broadcast \
  --verify
 