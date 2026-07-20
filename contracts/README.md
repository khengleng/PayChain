# PayChain EVM contracts

`PayChainToken` — a merchant coin (reserve-backed stablecoin, branded as loyalty points) as an
ERC-20 for the **custodial Base** track. One deployment per merchant coin.

This is the on-chain half of the EVM (Base) custodial path selected by `BLOCKCHAIN_KIND=evm`. PayChain
holds the minter key and every per-customer account key and signs on their behalf — the same custody
model as Stellar today — so a customer can **view** their coin in MetaMask by the contract address.
Reserve backing, mint gating, and the 3-way tie-out stay on PayChain's side, unchanged and
chain-agnostic. This contract only records supply/movement on chain.

## Contract
- `mint(to, amount)` — restricted to `MINTER_ROLE`. Reserve-gated **off-chain** before it is ever called.
- `burn(amount)` — `ERC20Burnable`; the holder (whom PayChain signs for) burns its own balance. Used
  for spend / redemption — supply drops accordingly.
- `decimals` — set at deploy; match your PayChain unit (Stellar-parity is 7).

## Build & deploy (Foundry)
```bash
# one-time
curl -L https://foundry.paradigm.xyz | bash && foundryup
cd contracts
forge install OpenZeppelin/openzeppelin-contracts foundry-rs/forge-std --no-git
forge build

# deploy one coin to Base Sepolia (testnet, chainId 84532)
export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
export TOKEN_NAME="PayKH Points" TOKEN_SYMBOL=PKHPTS TOKEN_DECIMALS=7
export TOKEN_ADMIN=0x...      # PayChain-controlled admin key
export TOKEN_MINTER=0x...     # PayChain minter/issuer key (signs mints)
export PRIVATE_KEY=0x...      # deployer, funded with Base Sepolia ETH
forge script script/Deploy.s.sol:Deploy --rpc-url "$BASE_SEPOLIA_RPC_URL" --broadcast
```

## Wire into PayChain
Set these on the API + worker services (see `packages/config`):
```
BLOCKCHAIN_KIND=evm
EVM_CHAIN=base-sepolia
EVM_RPC_URL=https://sepolia.base.org
EVM_CHAIN_ID=84532
EVM_TOKEN_ADDRESS=<deployed PayChainToken address>
EVM_TOKEN_CODE=PKHPTS
# optional gas drip so new custodial accounts can move their own tokens:
EVM_GAS_FUNDER_SECRET_KEY=0x...      # a PayChain-controlled, ETH-funded account
EVM_GAS_DRIP_WEI=200000000000000     # 0.0002 ETH per account
```
The deployed address is also the Asset row's `issuerPublicKey`, and `TOKEN_MINTER`'s private key is the
issuer/minter secret PayChain signs mints with.

## Scope & boundaries (Phase 1)
- **Testnet only.** Base mainnet (`EVM_CHAIN=base`) is fail-closed at boot until the minter key is
  HSM/KMS-backed — issuing real value with an in-process key is the same risk the Stellar mainnet gate
  refuses.
- **Custody = PayChain signs.** Freeze is enforced app-side (PayChain declines to sign for a frozen
  wallet); a plain ERC-20 has no per-account freeze. On-chain freeze would need a pausable/blacklist
  token (Phase 2).
- **Balance enumeration.** `getBalance` reports only the configured `EVM_TOKEN_ADDRESS` — EVM has no
  on-chain trustline list. Multi-merchant-coin balances and transaction history need a log indexer
  (Phase 2).
