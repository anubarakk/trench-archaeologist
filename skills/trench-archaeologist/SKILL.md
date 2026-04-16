---
name: trench-archaeologist
description: "Use this skill when a user or agent asks for a forensic report on an onchain DEX token, wants to investigate a token address, review a fresh meme or trench launch, recheck a previously examined token, compare a token against prior forensic history, or ask whether a token should be watched or avoided. This skill gathers live token, market, security, and trench-style launch evidence, generates a human-readable forensic report, and records structured forensic data on X Layer for proof, rechecks, and future agent reuse."
---

# Trench Archaeologist

Trench Archaeologist is a reusable forensic reporting skill for onchain DEX tokens. A user or agent can give it a token address in natural language, and the skill will investigate the token, detect the network automatically when possible, gather live Onchain OS evidence, generate a final forensic report, prepare a Uniswap `swap-planner`-style route suggestion with a real Uniswap deep link, and publish structured forensic data on X Layer through one real smart-contract transaction submitted through the Agentic Wallet path.

## When to Use

Use this skill when the user or agent wants to:
- give a token address and get a forensic report
- investigate a DEX token before buying, recommending, or monitoring it
- review a fresh meme or trench launch
- recheck the same token later
- compare a token against previously recorded forensic data
- ask whether a token should be watched, avoided, or rechecked

## Example Requests

- Give me a forensic report for this token: 0x...
- Investigate this token address: 0x...
- Recheck this token and compare it with prior forensic history
- Should I watch or avoid this token?
- Analyze this meme token and give me the final forensic report

## Do Not Use For

Do not use this skill for:
- broad all-market crypto research
- portfolio management
- general swap execution as the main task
- guaranteed scam detection claims
- storing the full human report onchain

## Main Workflow

1. Accept a token address from the user or agent, and use token name when available for readability and review.
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
11. Return the final forensic report using the structure described in `references/report-format.md`, including the Case Report proof fields:
   - X Layer (tx hash)
   - View on Explorer

## Report Structure

The final forensic report should use this structure:
- Token Details
- Market Activity
- Findings
- Conclusion
- Case Report
- Uniswap Plan

The Case Report should include:
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
