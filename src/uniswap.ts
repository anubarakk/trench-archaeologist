import type { ForensicReport, UniswapActionPlan } from "./types.js";

const UNISWAP_DEFAULTS: Record<string, { stableSymbol: string; stableAddress: string; chainParam: string }> = {
  ethereum: {
    stableSymbol: "USDC",
    stableAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    chainParam: "ethereum",
  },
  base: {
    stableSymbol: "USDC",
    stableAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    chainParam: "base",
  },
  arbitrum: {
    stableSymbol: "USDC",
    stableAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    chainParam: "arbitrum",
  },
  optimism: {
    stableSymbol: "USDC",
    stableAddress: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    chainParam: "optimism",
  },
  polygon: {
    stableSymbol: "USDC",
    stableAddress: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    chainParam: "polygon",
  },
  bsc: {
    stableSymbol: "USDC",
    stableAddress: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    chainParam: "bnb",
  },
  avalanche: {
    stableSymbol: "USDC",
    stableAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    chainParam: "avalanche",
  },
};

export function buildUniswapActionPlan(report: ForensicReport): UniswapActionPlan | undefined {
  if (report.type === "existing_record") {
    return undefined;
  }

  const chainConfig = UNISWAP_DEFAULTS[report.chain];
  if (!chainConfig) {
    return undefined;
  }

  const tokenSymbol = report.tokenSymbol ?? report.tokenName;
  const amount = choosePlanningAmount(report);

  if (isHighRisk(report)) {
    return createPlan({
      report,
      action: "exit-to-stable",
      inputTokenSymbol: tokenSymbol,
      inputTokenAddress: report.tokenAddress,
      outputTokenSymbol: chainConfig.stableSymbol,
      outputTokenAddress: chainConfig.stableAddress,
      amount,
      reason: "High-risk forensic verdict triggered a defensive Uniswap exit-planning path.",
      chainParam: chainConfig.chainParam,
    });
  }

  if (isWatchlist(report)) {
    return createPlan({
      report,
      action: "cautious-review",
      inputTokenSymbol: tokenSymbol,
      inputTokenAddress: report.tokenAddress,
      outputTokenSymbol: chainConfig.stableSymbol,
      outputTokenAddress: chainConfig.stableAddress,
      amount,
      reason: "Watchlist verdict triggered a cautious Uniswap planning path for optional defensive review.",
      chainParam: chainConfig.chainParam,
    });
  }

  return createPlan({
    report,
    action: "optional-entry-review",
    inputTokenSymbol: chainConfig.stableSymbol,
    inputTokenAddress: chainConfig.stableAddress,
    outputTokenSymbol: tokenSymbol,
    outputTokenAddress: report.tokenAddress,
    amount,
    reason: "Limited-concern verdict allows optional Uniswap entry planning after investigation.",
    chainParam: chainConfig.chainParam,
  });
}

function createPlan(params: {
  report: ForensicReport;
  action: UniswapActionPlan["action"];
  inputTokenSymbol: string;
  inputTokenAddress: string;
  outputTokenSymbol: string;
  outputTokenAddress: string;
  amount: string;
  reason: string;
  chainParam: string;
}): UniswapActionPlan {
  const {
    report,
    action,
    inputTokenSymbol,
    inputTokenAddress,
    outputTokenSymbol,
    outputTokenAddress,
    amount,
    reason,
    chainParam,
  } = params;

  return {
    action,
    plannerSkill: "swap-planner",
    chain: report.chain,
    inputTokenSymbol,
    inputTokenAddress,
    outputTokenSymbol,
    outputTokenAddress,
    amount,
    pairHint: `${inputTokenSymbol} -> ${outputTokenSymbol}`,
    reason,
    status: "planning_only",
    deepLink: buildDeepLink({
      chainParam,
      inputCurrency: inputTokenAddress,
      outputCurrency: outputTokenAddress,
      amount,
    }),
    executionVenue: "uniswap-web",
  };
}

function buildDeepLink(params: {
  chainParam: string;
  inputCurrency: string;
  outputCurrency: string;
  amount: string;
}): string {
  const query = new URLSearchParams({
    chain: params.chainParam,
    inputCurrency: params.inputCurrency,
    outputCurrency: params.outputCurrency,
    value: params.amount,
    field: "INPUT",
  });

  return `https://app.uniswap.org/swap?${query.toString()}`;
}

function choosePlanningAmount(report: ForensicReport): string {
  if (isHighRisk(report)) {
    return "100";
  }

  if (isWatchlist(report)) {
    return "100";
  }

  return "100";
}

function isHighRisk(report: ForensicReport): boolean {
  return report.conclusion[0].toLowerCase().includes("high-risk");
}

function isWatchlist(report: ForensicReport): boolean {
  return report.conclusion[0].toLowerCase().includes("watchlist");
}
