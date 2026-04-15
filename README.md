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
   Creates a Uniswap route suggestion and deep link.

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
  <https://www.oklink.com/x-layer/tx/0x92b5e9ae19e5b91428365b9e3f8c2fd7d7d2a21731299bcd7f1fadc312320b59>
- To inspect the forensic data, open **Input Data** and change the display from **Default Data** to **UTF-8**.

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
Nobody has built a self-growing immutable forensic record on X Layer Ecosystem. And every existing tool in crypto looks forward, scans new launches, detects rugs in real-time, alerts before entry. Nobody looks backward systematically. 

The result: the same rug patterns, the same whale manipulation tactics, the same influencer pump mechanics repeat over and over because there's no structured, agent-readable, permanent forensic record (X Layer) of what actually happened and why.

### What makes it different? 
- Everyone scans forward. We go backward. 
- Everyone detects rugs. We reconstruct why they worked and encode the pattern as a fingerprint via X Layer smart contract event log.
- Everyone produces reports for humans. We produce machine-readable pattern fingerprint for agents.

Trench Archaeologist fills this gap. You give it a token address, it digs through important data about that token, generates a forensic report, and records structured forensic data on-chain via X Layer smart contract so it becomes immutable and reusable by both humans and agents.

That fingerprint becomes part of a growing forensic record on X Layer. New tokens get scanned against the forensic record. If a new launch matches a known pattern, agents know before anyone else. 

This makes the forensic record useful for X Layer Ecosytem.

## Installation
For full project setup, environment variables, wallet setup, run commands, and troubleshooting, see:

- [INSTALL.md](./INSTALL.md)

Framework-specific skill installation:
- [OpenClaw](./.openclaw/INSTALL.md)
- [Codex](./.codex/INSTALL.md)
- [OpenCode](./.opencode/INSTALL.md)
- [Claude](./.claude/INSTALL.md)

## Resources
View the Demo Video and screenshots:

- <https://drive.google.com/drive/folders/1dUMI7iwTd8_BpsyR3PZYjDfLW3uzSP7G>
