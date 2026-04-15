import { config as loadEnv } from "dotenv";
import { runForensicReport } from "./index.js";
import { formatForensicReport } from "./report.js";
import { ValidationError } from "./utils.js";

loadEnv();

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const positional = args;
  const [tokenAddress, chain] = positional;

  if (!tokenAddress) {
    throw new ValidationError("Usage: npm run dev -- <token-address> [chain]");
  }

  const result = await runForensicReport({ tokenAddress, chain, publishToXLayer: true });
  console.log(formatForensicReport(result));
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
