import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Interface } from "ethers";
import type {
  CaseDecision,
  DecodedInputPayload,
  ForensicEvidence,
  HistoricalEvidence,
  PublishResult,
  PublishedForensicRecord,
  SnapshotRecord,
} from "./types.js";
import { interpretEvidence } from "./report.js";
import { ProviderError, ValidationError, assertValidBytes32, assertValidEvmAddress } from "./utils.js";

const execFileAsync = promisify(execFile);
const XLAYER_CHAIN_ID = "196";
const XLAYER_EXPLORER_BASE_URL = "https://www.oklink.com/x-layer/tx/";
const REGISTRY_EVENT_TOPIC = "0xac6118b360cdbfbd8ebb73e6ab59ead08a4ef36c109448e2c7d447cd6061ca58";
const PUBLISH_FORENSIC_SELECTOR = "0x00ceefcc";
const REGISTRY_INTERFACE = new Interface([
  "event ForensicRecordPublished(address indexed tokenAddress, string tokenName, string tokenSymbol, string sourceChain, string caseId, uint256 reportTimestamp, string reportType, uint8 verdictCode, uint8 confidenceBand, string top10HolderPercent, string bundleHoldingPercent, string sniperCount, bool honeypotFlag, bool riskFlag, string marketCap, string liquidity, string volume24h, bytes32 fingerprintHash, string previousCaseId, string matchedCaseId)",
  "function publishForensicRecord(string title,uint256 reportTimestamp,address tokenAddress,string tokenName,string tokenSymbol,string sourceChain,string caseId,string reportType,uint8 verdictCode,uint8 confidenceBand,string top10HolderPercent,string bundleHoldingPercent,string sniperCount,bool honeypotFlag,bool riskFlag,string marketCap,string liquidity,string volume24h,bytes32 fingerprintHash,string previousCaseId,string matchedCaseId)",
]);

export function buildSnapshotRecord(params: {
  caseDecision: CaseDecision;
  evidence: ForensicEvidence;
  verdictCode?: number;
  confidenceBand?: number;
  fingerprintHash?: string;
  timestamp?: number;
}): SnapshotRecord {
  const { caseDecision, evidence, timestamp = Date.now() } = params;
  const assessment = interpretEvidence(evidence);
  const fingerprintHash = params.fingerprintHash ?? computeFingerprintHash({ caseDecision, evidence, timestamp });

  return {
    title: buildForensicTitle({ evidence, caseDecision, timestamp }),
    reportTimestamp: timestamp,
    tokenAddress: evidence.token.tokenAddress,
    tokenName: evidence.token.tokenName ?? "Unknown Token",
    tokenSymbol: evidence.token.tokenSymbol ?? "UNKNOWN",
    sourceChain: evidence.token.chain,
    caseId: caseDecision.caseId,
    reportType: caseDecision.type,
    verdictCode: params.verdictCode ?? assessment.verdictCode,
    confidenceBand: params.confidenceBand ?? assessment.confidenceBand,
    top10HolderPercent: evidence.token.top10HoldPercent ?? "",
    bundleHoldingPercent: evidence.token.bundleHoldingPercent ?? "",
    sniperCount: evidence.token.sniperCount ?? "",
    honeypotFlag: evidence.security.isHoneypot ?? false,
    riskFlag: evidence.security.isRiskToken ?? false,
    marketCap: evidence.market.marketCap ?? evidence.token.marketCap ?? "",
    liquidity: evidence.market.liquidity ?? "",
    volume24h: evidence.market.volume ?? "",
    fingerprintHash,
    previousCaseId: caseDecision.previousCaseId ?? "",
    matchedCaseId: caseDecision.matchedCaseId ?? "",
  };
}

export async function publishSnapshotRecord(snapshot: SnapshotRecord): Promise<PublishResult> {
  const registryAddress = process.env.REGISTRY_CONTRACT_ADDRESS?.trim();
  const rpcUrl = process.env.XLAYER_RPC_URL?.trim();
  const onchainosBin = process.env.ONCHAINOS_BIN?.trim() || "onchainos";

  if (!registryAddress) {
    throw new ValidationError("REGISTRY_CONTRACT_ADDRESS is required for X Layer publish");
  }

  if (!rpcUrl) {
    throw new ValidationError("XLAYER_RPC_URL is required for X Layer receipt verification");
  }

  assertValidEvmAddress(registryAddress, "registry contract address");
  validateSnapshotRecord(snapshot);

  const inputData = encodePublishForensicRecord(snapshot);

  let stdout: string;
  try {
    const result = await execFileAsync(
      onchainosBin,
      [
        "wallet",
        "contract-call",
        "--chain",
        XLAYER_CHAIN_ID,
        "--to",
        registryAddress,
        "--input-data",
        inputData,
        "--gas-limit",
        "900000",
        "--force",
      ],
      { env: process.env },
    );
    stdout = result.stdout;
  } catch (error) {
    throw new ProviderError("xlayer-publish", error instanceof Error ? error.message : String(error));
  }

  const txHash = parseTxHash(stdout);
  const decodedInputPayload = await fetchDecodedInputPayload({ rpcUrl, txHash });
  const publishedRecord = await verifyPublishReceipt({
    rpcUrl,
    txHash,
    registryAddress,
    tokenAddress: snapshot.tokenAddress,
  });

  return {
    txHash,
    explorerUrl: `${XLAYER_EXPLORER_BASE_URL}${txHash}`,
    registryAddress,
    publishedRecord,
    decodedInputPayload,
  };
}

export async function fetchHistoricalEvidence(params: {
  tokenAddress: string;
  sourceChain: string;
}): Promise<HistoricalEvidence | undefined> {
  const registryAddress = process.env.REGISTRY_CONTRACT_ADDRESS?.trim();
  const rpcUrl = process.env.XLAYER_RPC_URL?.trim();

  if (!registryAddress || !rpcUrl) {
    return undefined;
  }

  assertValidEvmAddress(registryAddress, "registry contract address");
  assertValidEvmAddress(params.tokenAddress, "token address");

  const logs = await fetchLogs({
    rpcUrl,
    registryAddress,
    tokenAddress: params.tokenAddress,
  });

  const records = logs
    .map((log) => decodePublishedRecord(log))
    .filter((record): record is PublishedForensicRecord => Boolean(record))
    .filter((record) => record.sourceChain.toLowerCase() === params.sourceChain.toLowerCase())
    .sort((left, right) => right.reportTimestamp - left.reportTimestamp);

  if (!records.length) {
    return undefined;
  }

  const latest = records[0];
  return {
    previousCaseId: latest.caseId,
    matchedCaseId: latest.matchedCaseId || undefined,
    previousTxHash: latest.txHash,
    priorRecords: records,
  };
}

function buildForensicTitle(params: {
  evidence: ForensicEvidence;
  caseDecision: CaseDecision;
  timestamp: number;
}): string {
  const symbol = params.evidence.token.tokenSymbol ?? "UNKNOWN";
  const chain = params.evidence.token.chain;
  return `Trench Archaeologist | ${symbol} | ${chain} | ${params.caseDecision.caseId} | ${params.timestamp}`;
}

function computeFingerprintHash(params: {
  caseDecision: CaseDecision;
  evidence: ForensicEvidence;
  timestamp: number;
}): string {
  const payload = JSON.stringify({
    tokenAddress: params.evidence.token.tokenAddress.toLowerCase(),
    tokenName: params.evidence.token.tokenName ?? "",
    tokenSymbol: params.evidence.token.tokenSymbol ?? "",
    sourceChain: params.evidence.token.chain.toLowerCase(),
    caseId: params.caseDecision.caseId,
    reportType: params.caseDecision.type,
    top10HolderPercent: params.evidence.token.top10HoldPercent ?? "",
    bundleHoldingPercent: params.evidence.token.bundleHoldingPercent ?? "",
    sniperCount: params.evidence.token.sniperCount ?? "",
    honeypotFlag: params.evidence.security.isHoneypot ?? false,
    riskFlag: params.evidence.security.isRiskToken ?? false,
    marketCap: params.evidence.market.marketCap ?? params.evidence.token.marketCap ?? "",
    liquidity: params.evidence.market.liquidity ?? "",
    volume24h: params.evidence.market.volume ?? "",
    timestamp: params.timestamp,
  });

  return `0x${createHash("sha256").update(payload).digest("hex")}`;
}

function validateSnapshotRecord(snapshot: SnapshotRecord): void {
  assertValidEvmAddress(snapshot.tokenAddress, "token address");
  assertValidBytes32(snapshot.fingerprintHash, "fingerprint hash");

  if (!snapshot.title.trim()) {
    throw new ValidationError("Snapshot title is required");
  }

  if (!snapshot.tokenName.trim()) {
    throw new ValidationError("Snapshot tokenName is required");
  }

  if (!snapshot.tokenSymbol.trim()) {
    throw new ValidationError("Snapshot tokenSymbol is required");
  }

  if (!snapshot.sourceChain.trim()) {
    throw new ValidationError("Snapshot sourceChain is required");
  }

  if (!snapshot.caseId.trim()) {
    throw new ValidationError("Snapshot caseId is required");
  }

  if (!snapshot.reportType.trim()) {
    throw new ValidationError("Snapshot reportType is required");
  }
}

function encodePublishForensicRecord(snapshot: SnapshotRecord): string {
  const encoded: EncodedValue[] = [
    encodeString(snapshot.title),
    { kind: "static", value: encodeUint(snapshot.reportTimestamp) },
    encodeAddress(snapshot.tokenAddress),
    encodeString(snapshot.tokenName),
    encodeString(snapshot.tokenSymbol),
    encodeString(snapshot.sourceChain),
    encodeString(snapshot.caseId),
    encodeString(snapshot.reportType),
    { kind: "static", value: encodeUint(snapshot.verdictCode) },
    { kind: "static", value: encodeUint(snapshot.confidenceBand) },
    encodeString(snapshot.top10HolderPercent),
    encodeString(snapshot.bundleHoldingPercent),
    encodeString(snapshot.sniperCount),
    { kind: "static", value: encodeBool(snapshot.honeypotFlag) },
    { kind: "static", value: encodeBool(snapshot.riskFlag) },
    encodeString(snapshot.marketCap),
    encodeString(snapshot.liquidity),
    encodeString(snapshot.volume24h),
    encodeBytes32(snapshot.fingerprintHash),
    encodeString(snapshot.previousCaseId),
    encodeString(snapshot.matchedCaseId),
  ];

  const headSlots = encoded.length;
  let dynamicOffset = headSlots * 32;
  const head: string[] = [];
  const tail: string[] = [];

  for (const item of encoded) {
    if (item.kind === "static") {
      head.push(item.value);
      continue;
    }

    head.push(encodeUint(dynamicOffset));
    tail.push(item.value);
    dynamicOffset += item.byteLength;
  }

  return `${PUBLISH_FORENSIC_SELECTOR}${head.join("")}${tail.join("")}`;
}

async function fetchDecodedInputPayload(params: {
  rpcUrl: string;
  txHash: string;
}): Promise<DecodedInputPayload> {
  const tx = await fetchTransaction(params.rpcUrl, params.txHash);
  if (!tx?.input || typeof tx.input !== "string") {
    throw new ProviderError("xlayer-publish", `Missing input data for ${params.txHash}`);
  }

  return decodeInputPayload(tx.input);
}

function decodeInputPayload(inputData: string): DecodedInputPayload {
  const directCandidate = tryDecodePublishPayload(inputData);
  if (directCandidate) {
    return directCandidate;
  }

  const selectorIndex = inputData.toLowerCase().indexOf(PUBLISH_FORENSIC_SELECTOR.slice(2));
  if (selectorIndex >= 0) {
    const wrappedCandidate = tryDecodePublishPayload(`0x${inputData.slice(selectorIndex)}`);
    if (wrappedCandidate) {
      return wrappedCandidate;
    }
  }

  throw new ProviderError("xlayer-publish", "Unable to decode publishForensicRecord input payload");
}

function tryDecodePublishPayload(inputData: string): DecodedInputPayload | undefined {
  try {
    const parsed = REGISTRY_INTERFACE.parseTransaction({ data: inputData });
    if (!parsed || parsed.name !== "publishForensicRecord") {
      return undefined;
    }

    return {
      title: String(parsed.args.title),
      reportTimestamp: Number(parsed.args.reportTimestamp),
      tokenAddress: String(parsed.args.tokenAddress),
      tokenName: String(parsed.args.tokenName),
      tokenSymbol: String(parsed.args.tokenSymbol),
      sourceChain: String(parsed.args.sourceChain),
      caseId: String(parsed.args.caseId),
      reportType: String(parsed.args.reportType),
      verdictCode: Number(parsed.args.verdictCode),
      confidenceBand: Number(parsed.args.confidenceBand),
      top10HolderPercent: String(parsed.args.top10HolderPercent),
      bundleHoldingPercent: String(parsed.args.bundleHoldingPercent),
      sniperCount: String(parsed.args.sniperCount),
      honeypotFlag: Boolean(parsed.args.honeypotFlag),
      riskFlag: Boolean(parsed.args.riskFlag),
      marketCap: String(parsed.args.marketCap),
      liquidity: String(parsed.args.liquidity),
      volume24h: String(parsed.args.volume24h),
      fingerprintHash: String(parsed.args.fingerprintHash),
      previousCaseId: String(parsed.args.previousCaseId),
      matchedCaseId: String(parsed.args.matchedCaseId),
    };
  } catch {
    return undefined;
  }
}

async function verifyPublishReceipt(params: {
  rpcUrl: string;
  txHash: string;
  registryAddress: string;
  tokenAddress: string;
}): Promise<PublishedForensicRecord> {
  let receipt: any = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    receipt = await fetchReceipt(params.rpcUrl, params.txHash);
    if (receipt) {
      break;
    }

    await wait(1500);
  }

  if (!receipt || receipt.status !== "0x1") {
    throw new ProviderError("xlayer-publish", `Publish transaction failed or missing receipt for ${params.txHash}`);
  }

  const expectedIndexedTokenTopic = `0x${params.tokenAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;
  const matchingLog = Array.isArray(receipt.logs)
    ? receipt.logs.find((log: { address?: string; topics?: string[] }) =>
      log.address?.toLowerCase() === params.registryAddress.toLowerCase()
      && Array.isArray(log.topics)
      && log.topics[0]?.toLowerCase() === REGISTRY_EVENT_TOPIC
      && log.topics[1]?.toLowerCase() === expectedIndexedTokenTopic,
    )
    : undefined;

  if (!matchingLog) {
    throw new ProviderError("xlayer-publish", `Publish transaction ${params.txHash} did not emit ForensicRecordPublished`);
  }

  const decoded = decodePublishedRecord(matchingLog);
  if (!decoded) {
    throw new ProviderError("xlayer-publish", `Publish transaction ${params.txHash} emitted an unreadable forensic record`);
  }

  return decoded;
}

async function fetchLogs(params: {
  rpcUrl: string;
  registryAddress: string;
  tokenAddress: string;
}): Promise<any[]> {
  const tokenTopic = `0x${params.tokenAddress.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;
  const rpcUrls = uniqueRpcUrls([
    params.rpcUrl,
    process.env.XLAYER_RPC_FALLBACK_URL?.trim(),
    "https://xlayerrpc.okx.com",
  ]);

  let lastError: unknown;
  for (const rpcUrl of rpcUrls) {
    try {
      const latestBlockHex = await fetchBlockNumber(rpcUrl);
      const latestBlock = Number.parseInt(latestBlockHex, 16);

      if (!Number.isFinite(latestBlock) || latestBlock < 0) {
        throw new ProviderError("xlayer-rpc", "Invalid latest block number response");
      }

      const chunkSize = 5000;
      const lookbackBlocks = 20000;
      const startBlock = Math.max(latestBlock - lookbackBlocks, 0);
      const logs: any[] = [];

      for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += chunkSize) {
        const toBlock = Math.min(fromBlock + chunkSize - 1, latestBlock);
        const payload = await postRpcWithRetry(rpcUrl, {
          jsonrpc: "2.0",
          method: "eth_getLogs",
          params: [{
            address: params.registryAddress,
            fromBlock: `0x${fromBlock.toString(16)}`,
            toBlock: `0x${toBlock.toString(16)}`,
            topics: [REGISTRY_EVENT_TOPIC, tokenTopic],
          }],
          id: 1,
        });

        if (!Array.isArray(payload.result)) {
          throw new ProviderError("xlayer-rpc", "Unexpected eth_getLogs response shape");
        }

        logs.push(...payload.result);
      }

      return logs;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new ProviderError("xlayer-rpc", "Unable to read registry logs");
}

async function fetchBlockNumber(rpcUrl: string): Promise<string> {
  const payload = await postRpcWithRetry(rpcUrl, {
    jsonrpc: "2.0",
    method: "eth_blockNumber",
    params: [],
    id: 1,
  });

  if (typeof payload.result !== "string") {
    throw new ProviderError("xlayer-rpc", "Unexpected eth_blockNumber response shape");
  }

  return payload.result;
}

function decodePublishedRecord(log: any): PublishedForensicRecord | undefined {
  try {
    const parsed = REGISTRY_INTERFACE.parseLog({ topics: log.topics, data: log.data });
    if (!parsed || parsed.name !== "ForensicRecordPublished") {
      return undefined;
    }

    return {
      title: "",
      reportTimestamp: Number(parsed.args.reportTimestamp),
      tokenAddress: String(parsed.args.tokenAddress),
      tokenName: String(parsed.args.tokenName),
      tokenSymbol: String(parsed.args.tokenSymbol),
      sourceChain: String(parsed.args.sourceChain),
      caseId: String(parsed.args.caseId),
      reportType: String(parsed.args.reportType),
      verdictCode: Number(parsed.args.verdictCode),
      confidenceBand: Number(parsed.args.confidenceBand),
      top10HolderPercent: String(parsed.args.top10HolderPercent),
      bundleHoldingPercent: String(parsed.args.bundleHoldingPercent),
      sniperCount: String(parsed.args.sniperCount),
      honeypotFlag: Boolean(parsed.args.honeypotFlag),
      riskFlag: Boolean(parsed.args.riskFlag),
      marketCap: String(parsed.args.marketCap),
      liquidity: String(parsed.args.liquidity),
      volume24h: String(parsed.args.volume24h),
      fingerprintHash: String(parsed.args.fingerprintHash),
      previousCaseId: String(parsed.args.previousCaseId),
      matchedCaseId: String(parsed.args.matchedCaseId),
      txHash: String(log.transactionHash),
      blockNumber: Number.parseInt(String(log.blockNumber), 16),
    };
  } catch {
    return undefined;
  }
}

async function fetchTransaction(rpcUrl: string, txHash: string): Promise<any> {
  const payload = await postRpc(rpcUrl, {
    jsonrpc: "2.0",
    method: "eth_getTransactionByHash",
    params: [txHash],
    id: 1,
  });

  return payload.result;
}

async function fetchReceipt(rpcUrl: string, txHash: string): Promise<any> {
  const payload = await postRpc(rpcUrl, {
    jsonrpc: "2.0",
    method: "eth_getTransactionReceipt",
    params: [txHash],
    id: 1,
  });

  return payload.result;
}

async function postRpc(rpcUrl: string, body: Record<string, unknown>): Promise<any> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    throw new ProviderError("xlayer-rpc", "RPC rate limit reached while reading registry history");
  }

  if (!response.ok) {
    throw new ProviderError("xlayer-rpc", `RPC request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload.error) {
    throw new ProviderError("xlayer-rpc", payload.error.message ?? "Unknown RPC error");
  }

  return payload;
}

async function postRpcWithRetry(rpcUrl: string, body: Record<string, unknown>): Promise<any> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await postRpc(rpcUrl, body);
    } catch (error) {
      lastError = error;
      await wait(500 * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new ProviderError("xlayer-rpc", "RPC request failed after retries");
}

function parseTxHash(stdout: string): string {
  const parsed = JSON.parse(stdout) as { ok?: boolean; data?: { txHash?: string }; error?: string };

  if (!parsed.ok || !parsed.data?.txHash) {
    throw new ProviderError("xlayer-publish", parsed.error ?? "Missing txHash from onchainos response");
  }

  return parsed.data.txHash;
}

function encodeAddress(value: string): EncodedValue {
  return { kind: "static", value: value.toLowerCase().replace(/^0x/, "").padStart(64, "0") };
}

function encodeUint(value: number): string {
  return BigInt(value).toString(16).padStart(64, "0");
}

function encodeBool(value: boolean): string {
  return encodeUint(value ? 1 : 0);
}

function encodeBytes32(value: string): EncodedValue {
  return { kind: "static", value: value.replace(/^0x/, "").padStart(64, "0") };
}

function encodeString(value: string): EncodedValue {
  const bytes = Buffer.from(value, "utf8");
  const lengthWord = encodeUint(bytes.length);
  const paddedLength = Math.ceil(bytes.length / 32) * 32;
  const dataWord = bytes.toString("hex").padEnd(paddedLength * 2, "0");
  return {
    kind: "dynamic",
    value: `${lengthWord}${dataWord}`,
    byteLength: 32 + paddedLength,
  };
}

type EncodedValue =
  | { kind: "static"; value: string }
  | { kind: "dynamic"; value: string; byteLength: number };

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uniqueRpcUrls(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())).map((value) => value.trim()))];
}
