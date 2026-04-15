# Installation

## Prerequisites
Install these first:
- Node.js 20+ and npm
- git
- Onchain OS CLI (`onchainos`)

Check your environment:

```bash
node -v
npm -v
onchainos --help
```

## Clone the Repository
```bash
git clone <repo-url>
cd trench-archaeologist
```

## Install Dependencies
```bash
npm install
```

## Create Your Local Environment File
```bash
cp .env.example .env
```

Then edit `.env` and fill in the required values.

## Environment Variables
Required for usage:
- `OKX_API_KEY`
- `OKX_SECRET_KEY`
- `OKX_PASSPHRASE`
- `ONCHAINOS_BIN` (usually `onchainos`)
- `XLAYER_RPC_URL` (default public RPC can be `https://xlayer.drpc.org`)
- `REGISTRY_CONTRACT_ADDRESS` (`0x8295Db870C2045951a5d0Bef71E54D8718dF76eA`)

Also set:
- `AGENTIC_WALLET_ADDRESS` (set this to your own Agentic Wallet address)

Required only if you want to deploy a new registry contract yourself:
- `DEPLOYER_PRIVATE_KEY`

Do not commit `.env`, `.env.deploy`, or any private keys.

## How to Get OKX API Credentials
Create your OKX credentials from your OKX / Onchain OS setup, then place them in `.env`:
- `OKX_API_KEY`
- `OKX_SECRET_KEY`
- `OKX_PASSPHRASE`

These are required for authenticated Onchain OS data access used by the project.

## Agentic Wallet Setup
The publish flow depends on a live Agentic Wallet session tied to your own wallet.

Check wallet status:

```bash
onchainos wallet status
onchainos wallet addresses
```

If your wallet is not ready yet, create or log in to your own Agentic Wallet through the normal Onchain OS flow first. The project uses the live X Layer publish path as part of the report flow, so the wallet session must be available.

## Build
```bash
npm run build
```

## Run the Forensic Report
Use the token address directly. The project will try to detect the network automatically and will publish the forensic record on X Layer as part of the report flow.

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

## Verify a Successful Run
A successful run should return the locked final forensic report shape, including:
- `X Layer (tx hash)`
- `View on Explorer`
- a saved forensic record on the active X Layer registry

You can inspect recorded events here:
- <https://web3.okx.com/explorer/x-layer/address/0x8295db870c2045951a5d0bef71e54d8718df76ea/event>

## Troubleshooting
- **`onchainos: command not found`**  
  Install Onchain OS CLI and make sure it is on your PATH, or set `ONCHAINOS_BIN` in `.env`.

- **Authentication errors or missing data**  
  Recheck `OKX_API_KEY`, `OKX_SECRET_KEY`, and `OKX_PASSPHRASE`.

- **Wallet publish fails**  
  Confirm Agentic Wallet is logged in with `onchainos wallet status`, and make sure your local `.env` is present with `REGISTRY_CONTRACT_ADDRESS` and `XLAYER_RPC_URL` set.

- **X Layer readback is flaky**  
  Retry the publish or use `XLAYER_RPC_URL=https://xlayer.drpc.org`.

- **No output for unsupported chains**  
  Current practical support should be treated as EVM-focused.
