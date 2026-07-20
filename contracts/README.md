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
- `freeze(account)` / `unfreeze(account)` — `FREEZER_ROLE` (granted to the admin key). A frozen account
  can neither send nor receive (enforced in the OZ v5 `_update` hook) — defence-in-depth on top of the
  custodial gate, so a leaked account key still cannot move value once frozen.
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
# optional: additional coins for balance enumeration, as address:CODE pairs
EVM_TOKEN_ADDRESSES=0xCoinA:MERCHA,0xCoinB:MERCHB
# optional gas drip so new custodial accounts can move their own tokens:
EVM_GAS_FUNDER_SECRET_KEY=0x...      # a PayChain-controlled, ETH-funded account
EVM_GAS_DRIP_WEI=200000000000000     # 0.0002 ETH per account
```
The deployed address is also the Asset row's `issuerPublicKey`, and `TOKEN_MINTER`'s private key is the
issuer/minter secret PayChain signs mints with.

## Scope & boundaries
- **Testnet only.** Base mainnet (`EVM_CHAIN=base`) is fail-closed at boot until the minter key is
  HSM/KMS-backed — issuing real value with an in-process key is the same risk the Stellar mainnet gate
  refuses.
- **Custody = PayChain signs**, with on-chain freeze as defence-in-depth: freeze is now enforced both
  app-side (PayChain declines to sign for a frozen wallet) **and** on chain (`freeze`/`unfreeze` via
  `FREEZER_ROLE`), so a leaked account key still cannot move value.
- **Balance enumeration.** `getBalance` reports the configured coins (`EVM_TOKEN_ADDRESS` +
  `EVM_TOKEN_ADDRESSES`), and the provider also accepts an injected resolver so dynamically-provisioned
  merchant coins can be enumerated from the EVM Asset rows.
- **Still Phase 2b (next):** `getTransactionHistory` and the streaming reconciliation listener — both
  need a chunked `eth_getLogs` scanner with a persisted block cursor.
