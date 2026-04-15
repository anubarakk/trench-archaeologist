export type CaseType =
  | "new_report"
  | "recheck_report"
  | "historical_match_report"
  | "existing_record";

export interface CaseDecision {
  type: CaseType;
  caseId: string;
  previousCaseId?: string;
  matchedCaseId?: string;
  reason: string;
}

export interface TokenEvidence {
  tokenName?: string;
  tokenSymbol?: string;
  tokenAddress: string;
  chain: string;
  launchDate?: string;
  price?: string;
  top10HoldPercent?: string;
  bundleHoldingPercent?: string;
  suspiciousHoldingPercent?: string;
  sniperHoldingPercent?: string;
  sniperCount?: string;
  riskControlLevel?: string;
  holderCount?: string;
  marketCap?: string;
  tagSignals?: string[];
}

export interface MarketEvidence {
  liquidity?: string;
  volume?: string;
  change24h?: string;
  price?: string;
  marketCap?: string;
  holderCount?: string;
  txs24h?: string;
  volume1h?: string;
  priceChange1h?: string;
  bundleActivity?: string;
  clusterConcentration?: string;
  coverageStatus?: "available" | "unavailable";
  coverageNote?: string;
}

export interface SecurityEvidence {
  riskResult?: string;
  honeypot?: string;
  action?: string;
  warnings?: string[];
  isRiskToken?: boolean;
  isHoneypot?: boolean;
  isFakeLiquidity?: boolean;
  isLowLiquidity?: boolean;
  isMintable?: boolean;
  isNotRenounced?: boolean;
  isLiquidityRemoval?: boolean;
  isVeryHighLpHolderProp?: boolean;
  isVeryLowLpBurn?: boolean;
  isDumping?: boolean;
  isWashTrading?: boolean;
}

export interface TrenchEvidence {
  devWallet?: string;
  devReputation?: string;
  developerLaunchHistory?: string;
  similarTokensByCreator?: string;
  devHoldingInfo?: string;
  coverageNote?: string;
}

export interface DecodedInputPayload {
  title: string;
  reportTimestamp: number;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  sourceChain: string;
  caseId: string;
  reportType: string;
  verdictCode: number;
  confidenceBand: number;
  top10HolderPercent: string;
  bundleHoldingPercent: string;
  sniperCount: string;
  honeypotFlag: boolean;
  riskFlag: boolean;
  marketCap: string;
  liquidity: string;
  volume24h: string;
  fingerprintHash: string;
  previousCaseId: string;
  matchedCaseId: string;
}

export interface PublishedForensicRecord {
  title: string;
  reportTimestamp: number;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  sourceChain: string;
  caseId: string;
  reportType: string;
  verdictCode: number;
  confidenceBand: number;
  top10HolderPercent: string;
  bundleHoldingPercent: string;
  sniperCount: string;
  honeypotFlag: boolean;
  riskFlag: boolean;
  marketCap: string;
  liquidity: string;
  volume24h: string;
  fingerprintHash: string;
  previousCaseId: string;
  matchedCaseId: string;
  txHash: string;
  blockNumber: number;
}

export interface HistoricalEvidence {
  previousCaseId?: string;
  matchedCaseId?: string;
  previousTxHash?: string;
  whatChanged?: string[];
  priorRecords?: PublishedForensicRecord[];
}

export interface ForensicEvidence {
  token: TokenEvidence;
  market: MarketEvidence;
  security: SecurityEvidence;
  trench?: TrenchEvidence;
  historical?: HistoricalEvidence;
}

export interface UniswapActionPlan {
  action: "exit-to-stable" | "cautious-review" | "optional-entry-review";
  plannerSkill: "swap-planner";
  chain: string;
  inputTokenSymbol: string;
  inputTokenAddress: string;
  outputTokenSymbol: string;
  outputTokenAddress: string;
  amount: string;
  pairHint: string;
  reason: string;
  status: "planning_only";
  deepLink: string;
  executionVenue: "uniswap-web";
}

export interface ForensicReport {
  caseId: string;
  type: CaseType;
  reportDate: string;
  tokenName: string;
  tokenSymbol?: string;
  tokenAddress: string;
  chain: string;
  proofChain?: string;
  launchDate?: string;
  price?: string;
  liquidity?: string;
  volume?: string;
  change24h?: string;
  findings: string[];
  conclusion: [string, string, string];
  uniswapActionPlan?: UniswapActionPlan;
  txHash?: string;
  explorerUrl?: string;
  publishedRecord?: PublishedForensicRecord;
  decodedInputPayload?: DecodedInputPayload;
}

export interface SnapshotRecord {
  title: string;
  reportTimestamp: number;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  sourceChain: string;
  caseId: string;
  reportType: string;
  verdictCode: number;
  confidenceBand: number;
  top10HolderPercent: string;
  bundleHoldingPercent: string;
  sniperCount: string;
  honeypotFlag: boolean;
  riskFlag: boolean;
  marketCap: string;
  liquidity: string;
  volume24h: string;
  fingerprintHash: string;
  previousCaseId: string;
  matchedCaseId: string;
}

export interface PublishResult {
  txHash: string;
  explorerUrl: string;
  registryAddress: string;
  publishedRecord: PublishedForensicRecord;
  decodedInputPayload: DecodedInputPayload;
}

export interface VerdictAssessment {
  verdictLabel: string;
  verdictCode: number;
  confidenceBand: number;
  findings: string[];
  conclusion: [string, string, string];
}
