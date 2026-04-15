# Usage

Trench Archaeologist is a forensic reporting skill for onchain DEX tokens.

## Inputs
- token address
- token name when available for readability and review
- network only when automatic detection fails or when the user wants to specify it explicitly

## Outputs
- forensic report
- Uniswap plan with a real Uniswap deep link
- `X Layer (tx hash)` in the Case Report
- `View on Explorer` in the Case Report
- stored forensic data for future rechecks and lookups

## Evidence Sources
- Onchain OS token data
- Onchain OS market data
- Onchain OS security data
- Onchain OS trench-style launch data when relevant

## Prerequisites
Before using the live project flow, make sure you have:
- Node.js and npm installed
- `onchainos` CLI installed and available
- OKX API credentials
- a local `.env` created from `.env.example`
- an active session for your own Agentic Wallet because the report flow publishes on X Layer

## Local Setup
```bash
npm install
cp .env.example .env
npm run build
```

Then fill in `.env` with the required values:
- `OKX_API_KEY`
- `OKX_SECRET_KEY`
- `OKX_PASSPHRASE`
- `ONCHAINOS_BIN`
- `XLAYER_RPC_URL`
- `REGISTRY_CONTRACT_ADDRESS`

Also set:
- `AGENTIC_WALLET_ADDRESS` to your own Agentic Wallet address
- `DEPLOYER_PRIVATE_KEY` only for direct contract deployment

## Run the Forensic Report
Use the token address directly. The project will try to detect the network automatically and will publish the forensic record on X Layer as part of the report flow:

```bash
npm run dev -- <token-address>
```

Example:

```bash
npm run dev -- 0x3e17ee3b1895dd1a7cf993a89769c5e029584444
```

If needed, you can also provide the network explicitly:

```bash
npm run dev -- <token-address> <network>
```

## Wallet Checks
Before running the report, verify your wallet session:

```bash
onchainos wallet status
onchainos wallet addresses
```

## X Layer Output
The skill stores forensic data on X Layer through one real smart-contract publish transaction submitted through the Agentic Wallet path and returns the locked Case Report proof fields:
- `X Layer (tx hash)`
- `View on Explorer`
