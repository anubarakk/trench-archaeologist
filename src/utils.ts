import { createHash } from "node:crypto";
import type {
  CaseDecision,
  ForensicReport,
  MarketEvidence,
  SecurityEvidence,
  SnapshotRecord,
  TokenEvidence,
  TrenchEvidence,
} from "./types.js";

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const HEX_32_REGEX = /^0x[a-fA-F0-9]{64}$/;
const SUPPORTED_CHAINS = new Set(["xlayer", "ethereum", "base", "bsc", "arbitrum", "polygon", "solana"]);

export class ProviderError extends Error {
  constructor(provider: string, message: string) {
    super(`[${provider}] ${message}`);
    this.name = "ProviderError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function assertValidTokenAddress(address: string): void {
  if (!EVM_ADDRESS_REGEX.test(address)) {
    throw new ValidationError(`Invalid token address: ${address}`);
  }
}

export function assertValidEvmAddress(address: string, label = "address"): void {
  if (!EVM_ADDRESS_REGEX.test(address)) {
    throw new ValidationError(`Invalid ${label}: ${address}`);
  }
}

export function assertValidBytes32(value: string, label = "bytes32 value"): void {
  if (!HEX_32_REGEX.test(value)) {
    throw new ValidationError(`Invalid ${label}: ${value}`);
  }
}

export function assertSupportedChain(chain: string): void {
  if (!SUPPORTED_CHAINS.has(chain.toLowerCase())) {
    throw new ValidationError(`Unsupported chain: ${chain}`);
  }
}

export function normalizeChain(chain: string): string {
  return chain.trim().toLowerCase();
}

export function generateCaseId(params: {
  tokenAddress: string;
  chain: string;
  scope?: string;
  date?: string;
}): string {
  const { tokenAddress, chain, scope = "forensic", date = new Date().toISOString() } = params;

  const digest = createHash("sha256")
    .update(`${chain}:${tokenAddress}:${scope}:${date}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();

  return `TA-${chain.toUpperCase()}-${digest}`;
}

export function normalizeTokenEvidence(input: TokenEvidence): TokenEvidence {
  return {
    tokenName: normalizeOptionalText(input.tokenName),
    tokenSymbol: normalizeOptionalText(input.tokenSymbol),
    tokenAddress: input.tokenAddress.trim(),
    chain: input.chain.trim().toLowerCase(),
    launchDate: normalizeOptionalText(input.launchDate),
    price: normalizeOptionalText(input.price),
    top10HoldPercent: normalizeOptionalText(input.top10HoldPercent),
    bundleHoldingPercent: normalizeOptionalText(input.bundleHoldingPercent),
    suspiciousHoldingPercent: normalizeOptionalText(input.suspiciousHoldingPercent),
    sniperHoldingPercent: normalizeOptionalText(input.sniperHoldingPercent),
    sniperCount: normalizeOptionalText(input.sniperCount),
    riskControlLevel: normalizeOptionalText(input.riskControlLevel),
    holderCount: normalizeOptionalText(input.holderCount),
    marketCap: normalizeOptionalText(input.marketCap),
    tagSignals: (input.tagSignals ?? []).map((item) => item.trim()).filter(Boolean),
  };
}

export function normalizeMarketEvidence(input: MarketEvidence): MarketEvidence {
  return {
    liquidity: normalizeOptionalText(input.liquidity),
    volume: normalizeOptionalText(input.volume),
    change24h: normalizeOptionalText(input.change24h),
    price: normalizeOptionalText(input.price),
    marketCap: normalizeOptionalText(input.marketCap),
    holderCount: normalizeOptionalText(input.holderCount),
    txs24h: normalizeOptionalText(input.txs24h),
    volume1h: normalizeOptionalText(input.volume1h),
    priceChange1h: normalizeOptionalText(input.priceChange1h),
    bundleActivity: normalizeOptionalText(input.bundleActivity),
    clusterConcentration: normalizeOptionalText(input.clusterConcentration),
    coverageStatus: input.coverageStatus,
    coverageNote: normalizeOptionalText(input.coverageNote),
  };
}

export function normalizeSecurityEvidence(input: SecurityEvidence): SecurityEvidence {
  return {
    riskResult: normalizeOptionalText(input.riskResult),
    honeypot: normalizeOptionalText(input.honeypot),
    action: normalizeOptionalText(input.action),
    warnings: (input.warnings ?? []).map((item) => item.trim()).filter(Boolean),
    isRiskToken: input.isRiskToken,
    isHoneypot: input.isHoneypot,
    isFakeLiquidity: input.isFakeLiquidity,
    isLowLiquidity: input.isLowLiquidity,
    isMintable: input.isMintable,
    isNotRenounced: input.isNotRenounced,
    isLiquidityRemoval: input.isLiquidityRemoval,
    isVeryHighLpHolderProp: input.isVeryHighLpHolderProp,
    isVeryLowLpBurn: input.isVeryLowLpBurn,
    isDumping: input.isDumping,
    isWashTrading: input.isWashTrading,
  };
}

export function normalizeTrenchEvidence(input?: TrenchEvidence): TrenchEvidence | undefined {
  if (!input) return undefined;

  const normalized: TrenchEvidence = {
    devWallet: normalizeOptionalText(input.devWallet),
    devReputation: normalizeOptionalText(input.devReputation),
    developerLaunchHistory: normalizeOptionalText(input.developerLaunchHistory),
    similarTokensByCreator: normalizeOptionalText(input.similarTokensByCreator),
    devHoldingInfo: normalizeOptionalText(input.devHoldingInfo),
    coverageNote: normalizeOptionalText(input.coverageNote),
  };

  return Object.values(normalized).some(Boolean) ? normalized : undefined;
}

export function assertReportInvariants(report: ForensicReport): void {
  if (!report.caseId) throw new ValidationError("Report is missing caseId");
  if (!report.tokenAddress) throw new ValidationError("Report is missing tokenAddress");
  if (!report.chain) throw new ValidationError("Report is missing chain");
  if (report.conclusion.length !== 3) {
    throw new ValidationError("Report conclusion must contain exactly 3 parts");
  }
}

export function assertCaseSnapshotConsistency(params: {
  caseDecision: CaseDecision;
  report: ForensicReport;
  snapshot: SnapshotRecord;
}): void {
  const { caseDecision, report, snapshot } = params;

  if (caseDecision.caseId !== report.caseId || report.caseId !== snapshot.caseId) {
    throw new ValidationError("Case ID mismatch between decision, report, and snapshot");
  }

  if (caseDecision.type !== report.type || report.type !== snapshot.reportType) {
    throw new ValidationError("Report type mismatch between decision, report, and snapshot");
  }

  if (report.tokenAddress !== snapshot.tokenAddress) {
    throw new ValidationError("Token address mismatch between report and snapshot");
  }
}

function normalizeOptionalText(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
