---
name: trench-archaeologist
description: "Use this skill when a user or agent wants to investigate an onchain DEX token, review a fresh meme/trench launch, recheck a previously examined token, or compare a new token against previously recorded forensic data. This skill gathers live token, market, security, and trench-style launch evidence, generates a forensic report, and stores forensic data on X Layer for proof and future reference."
---

# Trench Archaeologist

Trench Archaeologist is a reusable forensic reporting skill for onchain DEX tokens. It digs through token, market, security, and trench-style launch data from Onchain OS to reconstruct token behavior, generate a forensic report, prepare a Uniswap `swap-planner`-style plan with a real Uniswap deep link, and store forensic data on X Layer through one real smart-contract publish transaction submitted through the Agentic Wallet path as part of the report flow.

## When to Use

Use this skill when the user wants to:
- investigate a DEX token
- review a fresh meme or trench launch
- understand a token before buying, recommending, or monitoring it
- recheck the same token later
- compare a new token against previously recorded forensic data

## Do Not Use For

Do not use this skill for:
- broad all-market crypto research
- portfolio management
- general swap execution as the main task
- guaranteed scam detection claims
- storing the full human report onchain

## Main Workflow

1. Collect token address, and use token name when available for readability and review.
2. Detect the real network automatically when possible, and only require explicit network input when detection fails.
3. Determine whether standard DEX evidence or trench-style evidence is more relevant.
4. Gather live evidence from Onchain OS sources.
5. Build the forensic report.
6. Determine the case type:
   - New Report
   - Recheck Report
   - Historical Match Report
   - Existing Record
7. Prepare a Uniswap `swap-planner`-style plan after the forensic verdict.
8. Build the forensic data payload.
9. Build the locked input payload and richer forensic record payload.
10. Store forensic data on X Layer through the active registry contract using the Agentic Wallet path.
11. Return the forensic report with the locked Case Report proof fields:
   - X Layer (tx hash)
   - View on Explorer

## Report Structure

The report should use this structure:
- Token Details
- Market Activity
- Findings
- Conclusion
- Case Report
- Uniswap Plan

For demo or submission output, the Case Report should include:
- X Layer (tx hash)
- View on Explorer

## Case Types

### New Report
Used when no previous report exists for the same token.

### Recheck Report
Used when the same token is examined again and new evidence is available.

### Historical Match Report
Used when a new token resembles or links to previously recorded forensic data.

### Existing Record
Used when the token already has an existing report and no materially different evidence is found.

## Active X Layer Registry
- Contract: `0x8295Db870C2045951a5d0Bef71E54D8718dF76eA`
- Deploy tx: `0xa458ebcb782035dd3d1e6a73a80346f070104ceb6c3078d661a7e32b63ed8ac2`

## References

Read these when needed:
- `references/usage.md`
- `references/report-format.md`
- `references/case-types.md`
- `references/xlayer-recording.md`
