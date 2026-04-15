import type { CaseDecision, ForensicEvidence, ForensicReport, VerdictAssessment } from "./types.js";
import { buildUniswapActionPlan } from "./uniswap.js";
import { assertReportInvariants } from "./utils.js";

export function buildForensicReport(params: {
  caseDecision: CaseDecision;
  evidence: ForensicEvidence;
  reportDate: string;
}): ForensicReport {
  const { caseDecision, evidence, reportDate } = params;
  const assessment = interpretEvidence(evidence);

  const report: ForensicReport = {
    caseId: caseDecision.caseId,
    type: caseDecision.type,
    reportDate,
    tokenName: evidence.token.tokenName ?? "Unknown Token",
    tokenSymbol: evidence.token.tokenSymbol,
    tokenAddress: evidence.token.tokenAddress,
    chain: evidence.token.chain,
    proofChain: "xlayer",
    launchDate: evidence.token.launchDate,
    price: evidence.token.price,
    liquidity: evidence.market.liquidity,
    volume: evidence.market.volume,
    change24h: evidence.market.change24h,
    findings: assessment.findings,
    conclusion: assessment.conclusion,
  };

  report.uniswapActionPlan = buildUniswapActionPlan(report);

  assertReportInvariants(report);
  return report;
}

export function interpretEvidence(evidence: ForensicEvidence): VerdictAssessment {
  const findings: string[] = [];
  const highRiskReasons: string[] = [];
  const watchlistReasons: string[] = [];

  if (evidence.token.top10HoldPercent) {
    const top10Formatted = formatFindingsPercent(evidence.token.top10HoldPercent);
    findings.push(`Top 10 holder concentration: ${top10Formatted}.`);
    const top10 = Number.parseFloat(evidence.token.top10HoldPercent);
    if (!Number.isNaN(top10) && top10 >= 80) {
      watchlistReasons.push(`Top holder concentration is elevated at ${top10Formatted}.`);
    }
  }

  if (evidence.token.bundleHoldingPercent) {
    findings.push(`Bundle-linked holding share: ${formatFindingsPercent(evidence.token.bundleHoldingPercent)}.`);
  }

  if (evidence.token.sniperCount) {
    findings.push(`Tracked sniper count: ${evidence.token.sniperCount}.`);
    const sniperCount = Number.parseFloat(evidence.token.sniperCount);
    if (!Number.isNaN(sniperCount) && sniperCount > 0) {
      watchlistReasons.push(`Sniper participation was detected (${evidence.token.sniperCount}).`);
    }
  }

  if (evidence.token.tagSignals?.some((tag) => /smartmoneybuy/i.test(tag))) {
    watchlistReasons.push("The token is attracting tracked smart-money buying interest, which can signal momentum but does not reduce concentration risk.");
  }

  if (evidence.security.isHoneypot === true) {
    findings.push("Security scan flagged honeypot behavior.");
    highRiskReasons.push("Security scan flagged honeypot behavior.");
  } else if (evidence.security.isHoneypot === false) {
    findings.push("Security scan did not flag honeypot behavior.");
  }

  if (evidence.security.isRiskToken === true) {
    findings.push("Security scan marked the token as risky.");
    highRiskReasons.push("Security scan marked the token as risky.");
  }

  if (evidence.security.isFakeLiquidity === true) {
    findings.push("Security scan flagged fake-liquidity behavior.");
    highRiskReasons.push("Security scan flagged fake-liquidity behavior.");
  }

  if (evidence.security.isLiquidityRemoval === true) {
    findings.push("Security scan detected liquidity-removal risk.");
    highRiskReasons.push("Security scan detected liquidity-removal risk.");
  }

  if (evidence.security.isMintable === true) {
    findings.push("Token contract remains mintable.");
    watchlistReasons.push("Token contract remains mintable.");
  }

  if (evidence.security.isNotRenounced === true) {
    findings.push("Ownership does not appear renounced.");
    watchlistReasons.push("Ownership does not appear renounced.");
  }

  if (evidence.security.isLowLiquidity === true) {
    findings.push("Security scan flagged low liquidity conditions.");
    watchlistReasons.push("Low liquidity conditions were flagged.");
  }

  if (evidence.security.isVeryHighLpHolderProp === true) {
    findings.push("LP holder concentration was flagged as very high.");
    watchlistReasons.push("LP holder concentration was flagged as very high.");
  }

  if (evidence.security.isVeryLowLpBurn === true) {
    findings.push("LP burn level was flagged as very low.");
    watchlistReasons.push("LP burn level was flagged as very low.");
  }

  if (evidence.security.isDumping === true) {
    findings.push("Security scan flagged dumping behavior.");
    watchlistReasons.push("Dumping behavior was flagged.");
  }

  if (evidence.security.isWashTrading === true) {
    findings.push("Security scan flagged wash-trading style activity.");
    watchlistReasons.push("Wash-trading style activity was flagged.");
  }

  if (evidence.security.riskResult) {
    findings.push(`Security risk result: ${evidence.security.riskResult}.`);
  }

  if (evidence.security.action) {
    findings.push(`Security action guidance: ${evidence.security.action}.`);
  }

  for (const warning of evidence.security.warnings ?? []) {
    findings.push(`Security warning: ${warning}.`);
  }

  if (evidence.market.coverageStatus === "unavailable" && evidence.market.coverageNote) {
    findings.push(`Market coverage note: ${evidence.market.coverageNote}`);
    watchlistReasons.push("Market coverage was incomplete for this token on the current provider path.");
  }


  if (evidence.market.bundleActivity) {
    findings.push(`Bundle activity signal: ${evidence.market.bundleActivity}.`);
    watchlistReasons.push(`Bundle activity signal was present: ${evidence.market.bundleActivity}.`);
  }

  if (evidence.market.clusterConcentration) {
    findings.push(`Cluster concentration signal: ${evidence.market.clusterConcentration}.`);
    watchlistReasons.push(`Cluster concentration signal was present: ${evidence.market.clusterConcentration}.`);
  }

  if (evidence.trench?.coverageNote) {
    findings.push(`Trench coverage note: ${evidence.trench.coverageNote}`);
  }

  if (evidence.trench?.devReputation) {
    findings.push(`Developer reputation signal: ${evidence.trench.devReputation}.`);
  }

  if (evidence.trench?.developerLaunchHistory) {
    findings.push(`Developer launch history: ${evidence.trench.developerLaunchHistory}.`);
    watchlistReasons.push(`Developer launch history requires review: ${evidence.trench.developerLaunchHistory}.`);
  }

  if (evidence.trench?.similarTokensByCreator) {
    findings.push(`Related creator token pattern: ${evidence.trench.similarTokensByCreator}.`);
  }

  if (evidence.trench?.devHoldingInfo) {
    findings.push(`Developer holding signal: ${evidence.trench.devHoldingInfo}.`);
    watchlistReasons.push(`Developer holding signal requires review: ${evidence.trench.devHoldingInfo}.`);
  }

  const uniqueFindings = dedupe(findings);
  const uniqueHighRiskReasons = dedupe(highRiskReasons);
  const uniqueWatchlistReasons = dedupe(watchlistReasons);

  if (uniqueHighRiskReasons.length > 0) {
    return {
      verdictLabel: "high_risk",
      verdictCode: 2,
      confidenceBand: 3,
      findings: uniqueFindings,
      conclusion: [
        "This token should be treated as a high-risk onchain token until proven otherwise.",
        uniqueHighRiskReasons[0],
        "The safer next step is to avoid exposure or recheck only after materially new evidence appears.",
      ],
    };
  }

  if (uniqueWatchlistReasons.length > 0) {
    return {
      verdictLabel: "watchlist",
      verdictCode: 1,
      confidenceBand: evidence.market.coverageStatus === "unavailable" ? 1 : 2,
      findings: uniqueFindings,
      conclusion: [
        "This token should be treated as a watchlist case rather than a clean token.",
        uniqueWatchlistReasons[0],
        "The safer next step is to monitor further behavior before treating it as trustworthy.",
      ],
    };
  }

  return {
    verdictLabel: "limited_concern",
    verdictCode: 0,
    confidenceBand: 1,
    findings: uniqueFindings.length
      ? uniqueFindings
      : ["Available provider evidence did not surface a strong forensic warning from the current token, market, security, or trench checks."],
    conclusion: [
      "This token currently shows limited confirmed forensic concern from the available evidence.",
      "The present report did not surface a decisive security or behavior-based risk trigger from the collected checks.",
      "The safer next step is to treat this as an early read and recheck if activity changes or stronger evidence appears.",
    ],
  };
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function formatForensicReport(result: {
  report: ForensicReport;
  caseDecision: CaseDecision;
  evidence: ForensicEvidence;
}): string {
  const { report, caseDecision, evidence } = result;

  const tokenDetails = compact([
    `Name: ${report.tokenName}${report.tokenSymbol ? ` (${report.tokenSymbol})` : ""}`,
    `Address: ${report.tokenAddress}`,
    `Network: ${formatNetwork(report.chain)}`,
    report.launchDate ? `Launch Date: ${formatLaunchDate(report.launchDate)}` : undefined,
  ]);

  const marketActivity = compact([
    report.price ? `Price: ${formatPrice(report.price)}` : undefined,
    evidence.market.holderCount ? `Holders: ${formatInteger(evidence.market.holderCount)}` : undefined,
    evidence.market.marketCap ? `Market Cap: ${formatNumber(evidence.market.marketCap)}` : undefined,
    report.liquidity ? `Liquidity: ${formatNumber(report.liquidity)}` : undefined,
    "",
    evidence.market.volume1h ? `1H Volume: ${formatNumber(evidence.market.volume1h)}` : undefined,
    evidence.market.priceChange1h ? `1H Change: ${formatPercent(evidence.market.priceChange1h)}` : undefined,
    "",
    report.volume ? `24H Volume: ${formatNumber(report.volume)}` : undefined,
    report.change24h ? `24H Change: ${formatPercent(report.change24h)}` : undefined,
    evidence.market.txs24h ? `24H Transactions: ${formatInteger(evidence.market.txs24h)}` : undefined,
    evidence.market.coverageNote ? `Coverage: ${evidence.market.coverageNote}` : undefined,
  ]);

  const findings = report.findings.length
    ? report.findings.map((finding, index) => `${index + 1}. ${finding}`)
    : ["1. No strong forensic finding was surfaced from the current provider evidence."];

  const caseReport = compact([
    `Date: ${formatDisplayDate(report.reportDate)}`,
    `Case ID: ${report.caseId}`,
    "",
    `Type: ${formatCaseType(report.type)}`,
    `Reason: ${caseDecision.reason}`,
    "",
    report.txHash ? `X Layer (tx hash): ${report.txHash}` : undefined,
    "",
    report.explorerUrl ? `View on Explorer: ${report.explorerUrl}` : undefined,
  ]);

  const decodedInputProof = report.decodedInputPayload
    ? compact([
      `Title: ${report.decodedInputPayload.title}`,
      `Report Timestamp: ${formatDisplayTimestamp(report.decodedInputPayload.reportTimestamp)}`,
      `Token Address: ${report.decodedInputPayload.tokenAddress}`,
      `Token Name: ${report.decodedInputPayload.tokenName}`,
      `Token Symbol: ${report.decodedInputPayload.tokenSymbol}`,
      `Source Chain: ${report.decodedInputPayload.sourceChain}`,
      `Case ID: ${report.decodedInputPayload.caseId}`,
      `Report Type: ${report.decodedInputPayload.reportType}`,
      `Verdict Code: ${report.decodedInputPayload.verdictCode}`,
      `Confidence Band: ${report.decodedInputPayload.confidenceBand}`,
    ])
    : [];

  const onchainProof = report.publishedRecord
    ? compact([
      `Published Token: ${report.publishedRecord.tokenAddress}`,
      `Token Name: ${report.publishedRecord.tokenName}`,
      `Token Symbol: ${report.publishedRecord.tokenSymbol}`,
      `Source Chain: ${report.publishedRecord.sourceChain}`,
      `Report Type: ${report.publishedRecord.reportType}`,
      `Report Timestamp: ${formatDisplayTimestamp(report.publishedRecord.reportTimestamp)}`,
      `Verdict Code: ${report.publishedRecord.verdictCode}`,
      `Confidence Band: ${report.publishedRecord.confidenceBand}`,
      report.publishedRecord.top10HolderPercent ? `Top 10 Holders: ${formatFindingsPercent(report.publishedRecord.top10HolderPercent)}` : undefined,
      report.publishedRecord.bundleHoldingPercent ? `Bundle Holdings: ${formatFindingsPercent(report.publishedRecord.bundleHoldingPercent)}` : undefined,
      report.publishedRecord.sniperCount ? `Sniper Count: ${formatInteger(report.publishedRecord.sniperCount)}` : undefined,
      `Honeypot Flag: ${report.publishedRecord.honeypotFlag ? "Yes" : "No"}`,
      `Risk Flag: ${report.publishedRecord.riskFlag ? "Yes" : "No"}`,
      report.publishedRecord.marketCap ? `Market Cap: ${formatNumber(report.publishedRecord.marketCap)}` : undefined,
      report.publishedRecord.liquidity ? `Liquidity: ${formatNumber(report.publishedRecord.liquidity)}` : undefined,
      report.publishedRecord.volume24h ? `24H Volume: ${formatNumber(report.publishedRecord.volume24h)}` : undefined,
      `Fingerprint: ${report.publishedRecord.fingerprintHash}`,
      report.publishedRecord.previousCaseId ? `Previous Case ID: ${report.publishedRecord.previousCaseId}` : undefined,
      report.publishedRecord.matchedCaseId ? `Matched Case ID: ${report.publishedRecord.matchedCaseId}` : undefined,
    ])
    : [];

  const sections = [
    section("🔖 Token Details", tokenDetails),
    section("📊 Market Activity", marketActivity),
    section("🔎 Findings", findings),
    section("📝 Conclusion", withSpacing(report.conclusion)),
    section("📌 Case Report", caseReport),
  ];

  if (report.uniswapActionPlan) {
    sections.push(
      section("🦄 Uniswap Plan", [
        `Suggested Route: ${report.uniswapActionPlan.pairHint}`,
        "",
        `Planning Note: ${report.uniswapActionPlan.reason}`,
        "",
        `Uniswap Link: ${report.uniswapActionPlan.deepLink}`,
      ]),
    );
  }

  return sections.join("\n\n");
}

function section(title: string, lines: string[]): string {
  return `${title}\n\n${lines.join("\n")}`;
}

function withSpacing(values: string[]): string[] {
  return values.flatMap((value, index) => (index < values.length - 1 ? [value, ""] : [value]));
}

function compact(values: Array<string | undefined>): string[] {
  const filtered: string[] = [];

  for (const value of values) {
    if (value === undefined) {
      continue;
    }

    if (value === "") {
      if (filtered.length > 0 && filtered[filtered.length - 1] !== "") {
        filtered.push(value);
      }
      continue;
    }

    filtered.push(value);
  }

  if (filtered[filtered.length - 1] === "") {
    filtered.pop();
  }

  return filtered;
}

function formatPrice(value: string): string {
  return `$${formatFixed(value, 2)}`;
}

function formatPercent(value: string): string {
  return `${formatFixed(value, 0)}%`;
}

function formatFindingsPercent(value: string): string {
  return `${formatFixed(value, 2)}%`;
}

function formatInteger(value: string): string {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(parsed);
}

function formatNumber(value: string): string {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(parsed);
}

function formatFixed(value: string, decimals: number): string {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(parsed);
}

function formatDisplayDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(parsed);
}

function formatLaunchDate(value: string): string {
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return formatDisplayDate(new Date(asNumber).toISOString());
  }

  return formatDisplayDate(value);
}

function formatNetwork(value: string): string {
  return value.trim().toUpperCase();
}

function formatDisplayTimestamp(value: number): string {
  return formatDisplayDate(new Date(value).toISOString());
}

function formatCaseType(type: CaseDecision["type"]): string {
  switch (type) {
    case "new_report":
      return "New Report";
    case "recheck_report":
      return "Recheck Report";
    case "historical_match_report":
      return "Historical Match Report";
    case "existing_record":
      return "Existing Record";
    default:
      return type;
  }
}
