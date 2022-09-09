import url from "node:url";

import req from "./phttps.mjs";

const TOKEN_ADDRESS = "0.0.968069";
const MAX_SUPPLY = 2500000000;
const DECIMALS_COUNT = 8;

const TOKEN_DISTRIBUTION_ACCOUNT = "0.0.968012";
const TEAM_ADVISORS_ACCOUNT = "0.0.968013";
const LIQUIDITY_FUND_ACCOUNT = "0.0.968014";
const TREASURY_ACCOUNT = "0.0.968016";
const RESERVES_ACCOUNT = "0.0.968017";
const STAKING_REWARD_SUBSIDIES_ACCOUNT = "0.0.968019";
const IDO_ROUND1_CONTRACT_ID = "0.0.1006289";
const IDO_ROUND2_CONTRACT_ID = "0.0.1032556";
const IDO_MAIN_ROUND_CONTRACT_ID = "0.0.1053185";
const HST_ACCOUNTS = [
  TOKEN_DISTRIBUTION_ACCOUNT,
  TEAM_ADVISORS_ACCOUNT,
  LIQUIDITY_FUND_ACCOUNT,
  TREASURY_ACCOUNT,
  RESERVES_ACCOUNT,
  STAKING_REWARD_SUBSIDIES_ACCOUNT,
];
const HST_IDO_CONTRACTS = [
  IDO_ROUND1_CONTRACT_ID,
  IDO_ROUND2_CONTRACT_ID,
  IDO_MAIN_ROUND_CONTRACT_ID,
];

export async function handler(event) {
  const totalNonDistributedTokens =
    (await getSupplyNonDistributedTokens()) +
    (await getIDONonDistributedTokens());
  const circulatingSupply = MAX_SUPPLY - totalNonDistributedTokens;

  return {
    body: `${circulatingSupply}`,
    headers: {
      "X-GitHub-Repo":
        "https://github.com/buidler-labs/headstarter-coingecko-api",
    },
    statusCode: 200,
  };
}

async function getSupplyNonDistributedTokens() {
  return await safelyGetAllHstTokensFor(HST_ACCOUNTS);
}

async function getIDONonDistributedTokens() {
  return await safelyGetAllHstTokensFor(HST_IDO_CONTRACTS);
}

async function safelyGetAllHstTokensFor(accounts) {
  let totalTokensInAccounts = 0;

  try {
    for (const accountId of accounts) {
      totalTokensInAccounts += await getHSTBalanceFor(accountId);
    }
  } catch (e) {
    console.error(
      `There was an issue while querying Hedera's Mirror for Held Account info: ${e.message}`
    );
  }
  return totalTokensInAccounts;
}

async function getHSTBalanceFor(accountId) {
  const rawMirrorInfo = await req({
    ...url.parse(
      `https://mainnet-public.mirrornode.hedera.com/api/v1/balances?account.id=${accountId}`
    ),
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const mirrorInfo = JSON.parse(rawMirrorInfo.body);

  for (const balanceInfo of mirrorInfo.balances) {
    if (balanceInfo.account === accountId) {
      for (const tokenInfo of balanceInfo.tokens) {
        if (tokenInfo.token_id === TOKEN_ADDRESS) {
          const decimaledBalance =
            tokenInfo.balance / Math.pow(10, DECIMALS_COUNT);
          return decimaledBalance;
        }
      }
    }
  }
}
