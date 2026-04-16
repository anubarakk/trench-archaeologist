# Usage

Trench Archaeologist is a forensic reporting skill for onchain DEX tokens. A user or agent can give it a token address in natural language, and the skill will investigate the token, generate a final forensic report, publish the forensic record on X Layer, and return proof through the Case Report.

## Example Requests

- Give me a forensic report for this token: 0x...
- Investigate this token address: 0x...
- Recheck this token against prior forensic history
- Should I watch or avoid this token?
- Analyze this token and return the final forensic report

## Interaction Pattern

The normal interaction pattern is:
1. a user or agent provides a token address
2. the skill detects the network automatically when possible
3. the skill gathers live Onchain OS evidence
4. the skill generates the final forensic report
5. the skill publishes the forensic record on X Layer
6. the skill returns the Case Report with tx hash and explorer link

## Inputs
- token address from the user or agent
- token name when available for readability and review
- network only when automatic detection fails or when the user wants to specify it explicitly

## Outputs
- final forensic report in the structure described in `report-format.md`
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
Before using the skill through the live project flow, make sure you have:
- Node.js and npm installed
- `onchainos` CLI installed and available
- OKX API credentials
- a local `.env` created from `.env.example`
- an active session for your own Agentic Wallet because the report flow publishes on X Layer

## Local Direct Execution Setup
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

## Local Direct Execution
Use the local project runner when you want to execute the skill directly from the repository. The project will try to detect the network automatically and will publish the forensic record on X Layer as part of the report flow.

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
Before running the skill through the live project flow, verify your wallet session:

```bash
onchainos wallet status
onchainos wallet addresses
```

## X Layer Output
The skill stores forensic data on X Layer through one real smart-contract publish transaction submitted through the Agentic Wallet path and returns the final Case Report proof fields:
- `X Layer (tx hash)`
- `View on Explorer`
