# Installing Trench Archaeologist for OpenClaw

Use this guide if you want OpenClaw to discover the reusable `trench-archaeologist` skill from this repository.

## What this installs

This installation exposes the skill folder:

- `skills/trench-archaeologist/SKILL.md`

It does not install API keys or wallet credentials for you. Those stay local in your own environment.

## Installation

1. Clone the repository somewhere stable:

```bash
git clone https://github.com/anubarakk/trench-archaeologist.git ~/.openclaw/trench-archaeologist
```

2. Create the shared skills directory if needed:

```bash
mkdir -p ~/.agents/skills
```

3. Remove any old Trench Archaeologist symlink or folder from the shared skills path:

```bash
rm -rf ~/.agents/skills/trench-archaeologist
```

4. Symlink the repo skill directory into OpenClaw's discovered skills path:

```bash
ln -s ~/.openclaw/trench-archaeologist/skills/trench-archaeologist ~/.agents/skills/trench-archaeologist
```

5. Restart OpenClaw so it reloads skills.

## Verify

Check that the symlink points to the actual skill directory:

```bash
ls -la ~/.agents/skills/trench-archaeologist
```

You should see the linked `SKILL.md` and `references/` directory.

## Local project setup

If you also want to run the TypeScript project directly:

```bash
cd ~/.openclaw/trench-archaeologist
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
- The Agentic Wallet publish path is part of the live flow, but wallet credentials and session setup must remain local to your machine.
- The skill is for forensic reporting on DEX tokens. It is not a generic trading skill.
- Do not commit `.env`, `.env.deploy`, or any private keys.
