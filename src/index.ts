import { buildSnapshotRecord, publishSnapshotRecord } from "./onchain.js";
import { detectTokenChain, gatherForensicEvidence } from "./providers.js";
import { buildForensicReport } from "./report.js";
import type { CaseDecision, HistoricalEvidence } from "./types.js";
import { ProviderError, assertCaseSnapshotConsistency, generateCaseId } from "./utils.js";

export function classifyCase(params: {
  tokenAddress: string;
  chain: string;
  historical?: HistoricalEvidence;
}): CaseDecision {
  const { tokenAddress, chain, historical } = params;

  if (historical?.previousCaseId) {
    return {
      type: "recheck_report",
      caseId: generateCaseId({ tokenAddress, chain, scope: "recheck" }),
      previousCaseId: historical.previousCaseId,
      reason: historical.whatChanged?.length
        ? "Existing token with materially updated evidence"
        : "Existing token with prior forensic records already published on X Layer",
    };
  }

  if (historical?.matchedCaseId) {
    return {
      type: "historical_match_report",
      caseId: generateCaseId({ tokenAddress, chain, scope: "historical-match" }),
      matchedCaseId: historical.matchedCaseId,
      reason: "New token linked to previously recorded forensic data",
    };
  }

  return {
    type: "new_report",
    caseId: generateCaseId({ tokenAddress, chain, scope: "new" }),
    reason: "No previous forensic data found for this token",
  };
}

export async function runForensicReport(params: {
  tokenAddress: string;
  chain?: string;
  includeTrenches?: boolean;
  publishToXLayer?: boolean;
}) {
  const { tokenAddress, includeTrenches = true, publishToXLayer = false } = params;
  const chain = params.chain?.trim() ? params.chain : await detectTokenChain(tokenAddress);

  const evidence = await gatherForensicEvidence({ tokenAddress, chain, includeTrenches });
  const caseDecision = classifyCase({ tokenAddress, chain, historical: evidence.historical });
  const report = buildForensicReport({
    caseDecision,
    evidence,
    reportDate: new Date().toISOString(),
  });
  const snapshot = buildSnapshotRecord({ caseDecision, evidence });

  assertCaseSnapshotConsistency({ caseDecision, report, snapshot });

  if (publishToXLayer) {
    try {
      const publishResult = await publishSnapshotRecord(snapshot);
      report.txHash = publishResult.txHash;
      report.explorerUrl = publishResult.explorerUrl;
      report.publishedRecord = publishResult.publishedRecord;
      report.decodedInputPayload = publishResult.decodedInputPayload;
    } catch (error) {
      throw new ProviderError(
        "xlayer-publish",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  return { evidence, caseDecision, report, snapshot };
}
