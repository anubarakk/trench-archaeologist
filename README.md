# Trench Archaeologist

## Project Intro
Trench Archaeologist is a reusable forensic reporting skill built specifically for DEX tokens. It analyzes tokens using Onchain OS market, security, token, and trench-style evidence, then generates forensic reports that both humans and agents can understand.

After each analysis, the forensic report is recorded onchain on X Layer through a smart contract. This creates a public library of forensic token records that can be reused in future forensic reports and filtered by other agents if they want to use the data.

## Architecture Overview
Trench Archaeologist has three core layers plus one Uniswap layer.

### System Structure
1. **Live Investigation Layer**  
   Gathers token, market, security, and trench-style evidence from the token address.

2. **Forensic Interpretation Layer**  
   Converts raw evidence into findings, verdicts, confidence, and a case classification.

3. **X Layer Forensic Registry Layer**  
   Publishes structured forensic records to an X Layer smart contract and fetches prior records for rechecks.

4. **Uniswap Layer**  
   Creates a Uniswap route suggestion and deep link while keeping the product forensic-first.

### Architecture Diagram
```text
Token Address
    ↓
Onchain OS Evidence Gathering
(token / market / security / trenches)
    ↓
Forensic Interpretation
(findings / conclusion / case type)
    ↓
Structured Forensic Record
    ↓
Agentic Wallet Publish Path
    ↓
X Layer Smart Contract
    ↓
Tx Hash + Explorer Link + Historical Readback
```

## Deployment Address
- **Smart Contract:** `0x8295Db870C2045951a5d0Bef71E54D8718dF76eA`
- **Agentic Wallet Address:** `0x915c43eea84d282c83b2ec51d14c733d15a53ce4`

### Why the Smart Contract Matters
- The smart contract makes forensic data reusable in future analysis, especially when analyzing the same token again.
- It helps track changes in patterns, behavior, and fingerprints across time.
- It makes forensic records filterable and usable by other agents.
- Transaction history and forensic records are stored in the contract’s **Events** tab, which makes them easier to fetch even if the registry grows to thousands of records.
- The transaction input data can also be viewed by switching the explorer input format from hex to UTF-8.

### Forensic Record

<https://web3.okx.com/explorer/x-layer/address/0x8295db870c2045951a5d0bef71e54d8718df76ea/event>

### Sample Transaction
- **Sample TX Hash (individual record):**  
  <https://web3.okx.com/explorer/x-layer/tx/0x4a480f35b8513ed8a0589471d699184e8e4e9505bfef691d22df9cd4380e4fe6>
- To inspect the forensic payload, open **Input Data** and change the display from **Default Data** to **UTF-8**.

## Onchain OS / Uniswap Skill Usage
- **okx-dex-token**  
  Used for token identity, token structure, holder distribution, creator-related context, and token-level metadata.

- **okx-dex-market**  
  Used for price, liquidity, volume, holder counts, transaction activity, and other market-behavior signals.

- **okx-security**  
  Used for token risk scanning, honeypot checks, and security warnings.

- **okx-dex-trenches**  
  Used when trench-style or meme-launch behavior is relevant, including developer history, similar creator tokens, bundle behavior, and related wallet signals.

- **okx-agentic-wallet**  
  Used to submit the real publish transaction that records each forensic report to the X Layer smart contract.

- **Uniswap `swap-planner`**  
  Used as the included Uniswap layer after the forensic verdict is generated. The project produces a Uniswap route suggestion and a real Uniswap deep link.

## Working Mechanics
1. A human or agent submits a token address.
2. Trench Archaeologist detects the network automatically when possible, then gathers live evidence from Onchain OS for that token.
3. The project classifies the case type.
4. The project generates a forensic report.
5. The project generates a Uniswap plan using `swap-planner` logic and a real Uniswap deep link.
6. The project builds structured forensic data.
7. In the full proof flow, the Agentic Wallet path publishes that data to the active X Layer registry smart contract.
8. The publish transaction returns a real tx hash and explorer link.
9. Future runs fetch prior forensic data from the contract and classify rechecks accordingly.

## Team Member
- **Mark**

## Project Positioning in the X Layer Ecosystem
Nobody has built a self-growing immutable forensic report library for X Layer in this form yet. This skill is useful for both humans and agents who want to trade through DEXs.

Before trading, they can perform a forensic report on a token to check patterns, fingerprints, repeated behavior, and other signals using the forensic records already stored in the X Layer smart contract:

- <https://web3.okx.com/explorer/x-layer/address/0x8295db870c2045951a5d0bef71e54d8718df76ea/event>

This skill helps them:
- make better decisions before buying
- understand the history of a token
- check whether the pattern changed or stayed similar to other tokens already recorded
- identify whether an existing behavior pattern may suggest a likely outcome over the next days or weeks, especially for meme tokens

Most existing crypto tools look forward. They scan new launches, detect rugs in real time, and alert before entry. Very few tools look backward systematically.

Because of that, the same rug patterns, whale manipulation tactics, and influencer pump mechanics can repeat without leaving behind a structured, agent-readable, permanent public record of their fingerprint or important behavior.

Trench Archaeologist helps fill that gap. You give it a token address, it digs through important data about that token, generates a forensic report, and records structured forensic data onchain so it becomes immutable and reusable by both humans and agents.

## Installation
For full project setup, environment variables, wallet setup, run commands, and troubleshooting, see:

- [INSTALL.md](./INSTALL.md)

Framework-specific skill installation:
- [OpenClaw](./.openclaw/INSTALL.md)
- [Codex](./.codex/INSTALL.md)
- [OpenCode](./.opencode/INSTALL.md)
- [Claude](./.claude/INSTALL.md)
