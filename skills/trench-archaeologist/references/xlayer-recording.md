# X Layer Recording

Trench Archaeologist stores forensic data on X Layer after generating a report.

## Active Registry
- Contract: `0x8295Db870C2045951a5d0Bef71E54D8718dF76eA`
- Deploy tx: `0xa458ebcb782035dd3d1e6a73a80346f070104ceb6c3078d661a7e32b63ed8ac2`

## Publish Requirements
Before live publish:
- `onchainos` must be installed
- OKX API credentials must exist in `.env`
- `XLAYER_RPC_URL` must be set
- `REGISTRY_CONTRACT_ADDRESS` must be set to the active contract
- your own Agentic Wallet must already be created or logged in

Useful checks:

```bash
onchainos wallet status
onchainos wallet addresses
```

## Publish Model
Each analysis publish uses one real smart-contract publish transaction.
That single transaction:
- carries a locked human-meaningful input payload
- calls the active registry contract
- emits the richer forensic record onchain
- returns a real tx hash and explorer link
- supports future rechecks and historical lookups

## Locked Transaction Input Fields
- title
- reportTimestamp
- tokenAddress
- tokenName
- tokenSymbol
- sourceChain
- caseId
- reportType
- verdictCode
- confidenceBand

## Locked Smart Contract Forensic Record Fields
- tokenAddress
- tokenName
- tokenSymbol
- sourceChain
- caseId
- reportTimestamp
- reportType
- verdictCode
- confidenceBand
- top10HolderPercent
- bundleHoldingPercent
- sniperCount
- honeypotFlag
- riskFlag
- marketCap
- liquidity
- volume24h
- fingerprintHash
- previousCaseId
- matchedCaseId

## Explorer Notes
- Individual publish transactions can be inspected through their tx hash.
- The contract event history can be viewed from the registry address events page.
- Explorer input data can be changed from hex to UTF-8 to inspect the human-readable forensic payload when supported.

## Purpose
This stored forensic data is used for:
- proof of report existence
- repeated-case checks
- historical reference
- future related-case lookups
- richer public forensic filtering for later analysis
