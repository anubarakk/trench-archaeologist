# CLAUDE.md

This repository provides Trench Archaeologist as a reusable forensic reporting skill for DEX tokens. A user or agent can give it a token address in natural language, and it returns a final forensic report with X Layer proof.

## What it does

Trench Archaeologist investigates a token, gathers live evidence through Onchain OS, generates a forensic report, prepares a Uniswap planning output, and records structured forensic data on X Layer through the Agentic Wallet publish path.

## Skill entry point

The reusable skill definition lives at:

- `skills/trench-archaeologist/SKILL.md`

Supporting references live at:

- `skills/trench-archaeologist/references/`

## When to use it

Use Trench Archaeologist when a user or agent wants to:
- investigate a DEX token
- review a fresh meme or trench launch
- understand a token before buying or monitoring it
- recheck a token later
- compare a new token against previously recorded forensic data

## Example Requests

- Give me a forensic report for this token: 0x...
- Investigate this token address: 0x...
- Recheck this token against prior forensic history
- Should I watch or avoid this token?

## What the skill should return

The skill should return:
- a human-readable forensic report
- a tx hash in the Case Report
- an explorer link in the Case Report

## Important project facts

- Tokens are analyzed on their real network.
- X Layer is the forensic registry layer.
- The active X Layer registry contract is `0x8295Db870C2045951a5d0Bef71E54D8718dF76eA`.
- The publish path uses Agentic Wallet.
- The Uniswap layer is included, but the project remains forensic-first.
- Current practical support should be treated as EVM-focused.

## Project structure

- `README.md` — project overview and setup
- `contracts/TrenchArchaeologistRegistry.sol` — X Layer registry contract
- `scripts/deploy-registry.ts` — direct registry deployment script
- `src/` — TypeScript implementation
- `skills/trench-archaeologist/` — reusable agent skill package

## Running locally

Typical local setup:

```bash
npm install
cp .env.example .env
npm run build
```

For direct repository execution, use the local project runner:

```bash
npm run dev -- <token-address>
```

The project will try to detect the network automatically and will publish the forensic record on X Layer as part of the report flow.

If needed, you can also provide the network explicitly:

```bash
npm run dev -- <token-address> <network>
```

Local `.env` should include the required OKX, RPC, registry, and your own Agentic Wallet settings. Keep secrets local and never commit them.
