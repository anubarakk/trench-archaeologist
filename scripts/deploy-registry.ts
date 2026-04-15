import { readFile } from "node:fs/promises";
import process from "node:process";
import { ContractFactory, JsonRpcProvider, Wallet } from "ethers";

const XLAYER_EXPLORER_BASE_URL = "https://www.oklink.com/x-layer/tx/";

async function main(): Promise<void> {
  const rpcUrl = process.env.XLAYER_RPC_URL?.trim();
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY?.trim();

  if (!rpcUrl) {
    throw new Error("XLAYER_RPC_URL is required");
  }

  if (!privateKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY is required");
  }

  const [abiText, bytecodeRaw] = await Promise.all([
    readFile("/tmp/trench-registry-abi.json", "utf8"),
    readFile("/tmp/trench-registry-bin.txt", "utf8"),
  ]);

  const abi = JSON.parse(abiText);
  const bytecode = `0x${bytecodeRaw.trim().replace(/^0x/, "")}`;

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  const factory = new ContractFactory(abi, bytecode, wallet);

  console.log(`Deploying registry from ${wallet.address}...`);
  const contract = await factory.deploy();
  const deploymentTx = contract.deploymentTransaction();

  if (!deploymentTx) {
    throw new Error("Missing deployment transaction");
  }

  console.log(`Deployment tx: ${deploymentTx.hash}`);
  console.log(`Explorer: ${XLAYER_EXPLORER_BASE_URL}${deploymentTx.hash}`);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`Registry deployed at: ${contractAddress}`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
