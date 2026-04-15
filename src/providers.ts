import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fetchHistoricalEvidence } from "./onchain.js";
import type { ForensicEvidence, MarketEvidence, SecurityEvidence, TokenEvidence, TrenchEvidence } from "./types.js";
import {
  ProviderError,
  assertSupportedChain,
  assertValidTokenAddress,
  normalizeChain,
  normalizeMarketEvidence,
  normalizeSecurityEvidence,
  normalizeTokenEvidence,
  normalizeTrenchEvidence,
} from "./utils.js";

const execFileAsync = promisify(execFile);
const ONCHAINOS_BIN = process.env.ONCHAINOS_BIN ?? "onchainos";
const AUTO_DETECT_CHAINS = ["bsc", "base", "ethereum", "arbitrum", "polygon", "xlayer"] as const;

export async function detectTokenChain(tokenAddress: string): Promise<string> {
  const normalizedAddress = tokenAddress.trim();
  assertValidTokenAddress(normalizedAddress);

  for (const chain of AUTO_DETECT_CHAINS) {
    try {
      const identityData = await runProviderCommand(
        ["token", "info", "--chain", chain, "--address", normalizedAddress],
        `okx-dex-token-info:${chain}`,
      );

      const candidateName = readNestedString(identityData, ["tokenName"]) ?? readNestedString(identityData, ["name"]);
      const candidateSymbol = readNestedString(identityData, ["tokenSymbol"]) ?? readNestedString(identityData, ["symbol"]);
      const candidateAddress = readNestedString(identityData, ["tokenAddress"]) ?? readNestedString(identityData, ["address"]);

      if (candidateName || candidateSymbol || candidateAddress) {
        return chain;
      }
    } catch {
      continue;
    }
  }

  throw new ProviderError(
    "network-detection",
    "Unable to determine the token network automatically. Please provide the network explicitly.",
  );
}

export async function gatherForensicEvidence(params: {
  tokenAddress: string;
  chain: string;
  includeTrenches?: boolean;
}): Promise<ForensicEvidence> {
  const { includeTrenches = true } = params;
  const tokenAddress = params.tokenAddress.trim();
  const chain = normalizeChain(params.chain);

  assertValidTokenAddress(tokenAddress);
  assertSupportedChain(chain);

  const [token, market, security, trench, historical] = await Promise.all([
    fetchDexTokenEvidence(tokenAddress, chain),
    fetchDexMarketEvidence(tokenAddress, chain),
    fetchSecurityEvidence(tokenAddress, chain),
    includeTrenches ? fetchDexTrenchesEvidence(tokenAddress, chain) : Promise.resolve(undefined),
    fetchHistoricalEvidence({ tokenAddress, sourceChain: chain }).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      if (/xlayer-rpc/i.test(message)) {
        return undefined;
      }
      throw error;
    }),
  ]);

  const mergedToken: TokenEvidence = {
    ...token,
    price: token.price ?? market.price,
    holderCount: token.holderCount ?? market.holderCount,
    marketCap: token.marketCap ?? market.marketCap,
  };

  const normalizedMarket = normalizeMarketEvidence(market);
  if (!normalizedMarket.price && mergedToken.price) {
    normalizedMarket.price = mergedToken.price;
  }

  return {
    token: normalizeTokenEvidence(mergedToken),
    market: normalizedMarket,
    security: normalizeSecurityEvidence(security),
    trench: normalizeTrenchEvidence(trench),
    historical,
  };
}

async function fetchDexTokenEvidence(tokenAddress: string, chain: string): Promise<TokenEvidence> {
  const [identityData, advancedData] = await Promise.all([
    runProviderCommand(["token", "info", "--chain", chain, "--address", tokenAddress], "okx-dex-token-info"),
    runProviderCommand(["token", "advanced-info", "--chain", chain, "--address", tokenAddress], "okx-dex-token"),
  ]);

  return {
    tokenName:
      readNestedString(identityData, ["tokenName"]) ??
      readNestedString(identityData, ["name"]) ??
      readNestedString(advancedData, ["tokenName"]) ??
      readNestedString(advancedData, ["name"]) ??
      readNestedString(advancedData, ["baseToken", "tokenName"]) ??
      readNestedString(advancedData, ["baseToken", "name"]),
    tokenSymbol:
      readNestedString(identityData, ["tokenSymbol"]) ??
      readNestedString(identityData, ["symbol"]),
    tokenAddress,
    chain,
    launchDate:
      readNestedString(advancedData, ["deployTime"]) ??
      readNestedString(advancedData, ["launchTime"]) ??
      readNestedString(advancedData, ["createTime"]) ??
      readNestedString(advancedData, ["createdAt"]),
    price:
      readNestedString(identityData, ["price"]) ??
      readNestedString(advancedData, ["price"]) ??
      readNestedString(advancedData, ["priceUsd"]) ??
      readString(advancedData.price),
    top10HoldPercent: readNestedString(advancedData, ["top10HoldPercent"]),
    bundleHoldingPercent: readNestedString(advancedData, ["bundleHoldingPercent"]),
    suspiciousHoldingPercent: readNestedString(advancedData, ["suspiciousHoldingPercent"]),
    sniperHoldingPercent: readNestedString(advancedData, ["sniperHoldingPercent"]),
    sniperCount: readNestedString(advancedData, ["snipersTotal"]),
    riskControlLevel: readNestedString(advancedData, ["riskControlLevel"]),
    tagSignals: readStringArray(advancedData, ["tokenTags"]),
  };
}

async function fetchDexMarketEvidence(tokenAddress: string, chain: string): Promise<MarketEvidence> {
  try {
    const data = await runProviderCommand(
      ["token", "price-info", "--chain", chain, "--address", tokenAddress],
      "okx-dex-market",
    );

    return {
      liquidity: readNestedString(data, ["liquidity"]) ?? readNestedString(data, ["liquidityUsd"]),
      volume: readNestedString(data, ["volume24H"]) ?? readNestedString(data, ["volume24h"]) ?? readNestedString(data, ["volume"]),
      change24h: readNestedString(data, ["priceChange24H"]) ?? readNestedString(data, ["priceChange24h"]) ?? readNestedString(data, ["change24h"]),
      price: readNestedString(data, ["price"]),
      marketCap: readNestedString(data, ["marketCap"]),
      holderCount: readNestedString(data, ["holders"]),
      txs24h: readNestedString(data, ["txs24H"]),
      volume1h: readNestedString(data, ["volume1H"]),
      priceChange1h: readNestedString(data, ["priceChange1H"]),
      bundleActivity: readNestedString(data, ["bundleActivity"]),
      clusterConcentration:
        readNestedString(data, ["holderConcentration"]) ?? readNestedString(data, ["clusterConcentration"]),
      coverageStatus: "available",
    };
  } catch (error) {
    if (isMissingCoverageError(error)) {
      return {
        coverageStatus: "unavailable",
        coverageNote: `Market coverage unavailable for ${chain}:${tokenAddress}.`,
      };
    }

    throw error;
  }
}

async function fetchSecurityEvidence(tokenAddress: string, chain: string): Promise<SecurityEvidence> {
  const chainId = resolveSecurityChainId(chain);
  const data = await runProviderCommand(
    ["security", "token-scan", "--chain", chain, "--tokens", `${chainId}:${tokenAddress}`],
    "okx-security",
  );

  const warnings = [
    readNestedString(data, ["riskDetail"]),
    readNestedString(data, ["reason"]),
    readNestedString(data, ["message"]),
  ].filter((value): value is string => Boolean(value));

  return {
    riskResult:
      readNestedString(data, ["riskLevel"]) ??
      readNestedString(data, ["riskResult"]) ??
      readNestedString(data, ["level"]),
    honeypot:
      readNestedString(data, ["honeypotResult"]) ??
      readNestedString(data, ["honeypot"]) ??
      stringifyBoolean(readNestedBoolean(data, ["isHoneypot"])),
    action: readNestedString(data, ["riskAction"]) ?? readNestedString(data, ["action"]),
    warnings,
    isRiskToken: readNestedBoolean(data, ["isRiskToken"]),
    isHoneypot: readNestedBoolean(data, ["isHoneypot"]),
    isFakeLiquidity: readNestedBoolean(data, ["isFakeLiquidity"]),
    isLowLiquidity: readNestedBoolean(data, ["isLowLiquidity"]),
    isMintable: readNestedBoolean(data, ["isMintable"]),
    isNotRenounced: readNestedBoolean(data, ["isNotRenounced"]),
    isLiquidityRemoval: readNestedBoolean(data, ["isLiquidityRemoval"]),
    isVeryHighLpHolderProp: readNestedBoolean(data, ["isVeryHighLpHolderProp"]),
    isVeryLowLpBurn: readNestedBoolean(data, ["isVeryLowLpBurn"]),
    isDumping: readNestedBoolean(data, ["isDumping"]),
    isWashTrading: readNestedBoolean(data, ["isWash"]) ?? readNestedBoolean(data, ["isWash2"]),
  };
}

function resolveSecurityChainId(chain: string): string {
  const chainIds: Record<string, string> = {
    ethereum: "1",
    base: "8453",
    arbitrum: "42161",
    polygon: "137",
    bsc: "56",
    xlayer: "196",
  };

  return chainIds[chain] ?? chain;
}

async function fetchDexTrenchesEvidence(tokenAddress: string, chain: string): Promise<TrenchEvidence | undefined> {
  if (!["solana", "bsc"].includes(chain)) {
    return {
      coverageNote: `Trench-style launch analysis is not enabled for ${chain}.`,
    };
  }

  try {
    const data = await runProviderCommand(
      ["memepump", "token-details", "--chain", chain, "--address", tokenAddress],
      "okx-dex-trenches",
    );

    return {
      devWallet: readNestedString(data, ["devWallet"]) ?? readNestedString(data, ["creatorAddress"]),
      devReputation: readNestedString(data, ["devReputation"]) ?? readNestedString(data, ["creatorReputation"]),
      developerLaunchHistory:
        readNestedString(data, ["developerLaunchHistory"]) ?? readNestedString(data, ["creatorHistory"]),
      similarTokensByCreator:
        readNestedString(data, ["similarTokensByCreator"]) ?? readNestedString(data, ["relatedTokens"]),
      devHoldingInfo: readNestedString(data, ["devHoldingInfo"]) ?? readNestedString(data, ["creatorHoldingInfo"]),
    };
  } catch {
    return {
      coverageNote: `Trench-style launch data was unavailable for ${chain}:${tokenAddress}.`,
    };
  }
}

async function runProviderCommand(args: string[], provider: string): Promise<Record<string, unknown>> {
  try {
    const { stdout, stderr } = await execFileAsync(ONCHAINOS_BIN, args, { maxBuffer: 1024 * 1024 });
    return parseProviderOutput(`${stdout ?? ""}${stderr ?? ""}`.trim(), provider);
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new ProviderError(provider, message);
  }
}

function parseProviderOutput(output: string, provider: string): Record<string, unknown> {
  if (!output) {
    throw new ProviderError(provider, "Command returned no output");
  }

  const parsed = parseJsonFromOutput(output, provider);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ProviderError(provider, "Expected object response");
  }

  const response = parsed as Record<string, unknown>;
  const payload = response.data ?? response;

  if (!payload || typeof payload !== "object") {
    throw new ProviderError(provider, "Expected provider payload object or array response");
  }

  if (Array.isArray(payload)) {
    const firstItem = payload[0];
    if (!firstItem || typeof firstItem !== "object" || Array.isArray(firstItem)) {
      throw new ProviderError(provider, "Expected non-empty object array response");
    }
    return firstItem as Record<string, unknown>;
  }

  return payload as Record<string, unknown>;
}

function parseJsonFromOutput(output: string, provider: string): unknown {
  try {
    return JSON.parse(output);
  } catch {
    const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

    for (let index = lines.length - 1; index >= 0; index -= 1) {
      try {
        return JSON.parse(lines[index]);
      } catch {
        continue;
      }
    }

    throw new ProviderError(provider, `Unable to parse JSON output: ${output.slice(0, 300)}`);
  }
}

function isMissingCoverageError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /No price data found/i.test(message);
}

function asObject(value: unknown, provider: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ProviderError(provider, "Expected object response");
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNestedString(source: Record<string, unknown>, path: string[]): string | undefined {
  let current: unknown = source;

  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return readString(current);
}

function readStringArray(source: Record<string, unknown>, path: string[]): string[] | undefined {
  let current: unknown = source;

  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  if (!Array.isArray(current)) {
    return undefined;
  }

  const values = current
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .map((value) => value.trim());
  return values.length ? values : undefined;
}

function readNestedBoolean(source: Record<string, unknown>, path: string[]): boolean | undefined {
  let current: unknown = source;

  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "boolean" ? current : undefined;
}

function stringifyBoolean(value: boolean | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value ? "true" : "false";
}
