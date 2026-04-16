# Installing Trench Archaeologist for OpenCode

Use this guide if you want OpenCode to discover the reusable `trench-archaeologist` skill from this repository.

## What this installs

This installation exposes the skill folder:

- `skills/trench-archaeologist/SKILL.md`

It does not install API keys, wallet credentials, or RPC settings for you.

## Installation

1. Clone the repository somewhere stable:

```bash
git clone https://github.com/anubarakk/trench-archaeologist.git ~/.config/opencode/trench-archaeologist
```

2. Create the OpenCode skills directory if needed:

```bash
mkdir -p ~/.config/opencode/skills
```

3. Remove any old Trench Archaeologist symlink or folder:

```bash
rm -rf ~/.config/opencode/skills/trench-archaeologist
```

4. Symlink the actual skill directory:

```bash
ln -s ~/.config/opencode/trench-archaeologist/skills/trench-archaeologist ~/.config/opencode/skills/trench-archaeologist
```

5. Restart OpenCode so it reloads skills.

## Verify

```bash
ls -la ~/.config/opencode/skills/trench-archaeologist
```

You should see the linked `SKILL.md` and `references/` directory.

## Local project setup

If you also want to run the project directly:

```bash
cd ~/.config/opencode/trench-archaeologist
npm install
cp .env.example .env
```

Then fill in your local `.env`.

Required for usage:
- `OKX_API_KEY`
- `OKX_SECRET_KEY`
- `OKX_PASSPHRASE`
- `ONCHAINOS_BIN`
- `XLAYER_RPC_URL`
- `REGISTRY_CONTRACT_ADDRESS`

Also set:
- `AGENTIC_WALLET_ADDRESS` to your own Agentic Wallet address
- `DEPLOYER_PRIVATE_KEY` only for direct registry deployment

## Wallet setup

Before running the forensic report, create or log in to your own Agentic Wallet and make sure it is available:

```bash
onchainos wallet status
onchainos wallet addresses
```

## Example Skill Requests

- Give me a forensic report for this token: 0x...
- Investigate this token address: 0x...
- Recheck this token against prior forensic history
- Should I watch or avoid this token?

## Run locally

Build:

```bash
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

## Troubleshooting

- If `onchainos` is not found, install it first or set `ONCHAINOS_BIN`.
- If authenticated queries fail, recheck your OKX API credentials.
- If publish fails, confirm Agentic Wallet is logged in.
- If X Layer readback is flaky, retry with `XLAYER_RPC_URL=https://xlayer.drpc.org`.

## Notes

- The active X Layer registry contract is `0x8295Db870C2045951a5d0Bef71E54D8718dF76eA`.
- The publish path uses Agentic Wallet, so wallet/session setup must exist locally.
- The skill is intended for forensic reporting and historical rechecks on DEX tokens.
- Do not commit `.env`, `.env.deploy`, or any private keys.
